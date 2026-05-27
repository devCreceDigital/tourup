import json
from dataclasses import dataclass
from typing import List, Optional

from apps.asistente_ia.ai.llm.openrouter_client import openrouter_client


@dataclass
class IntentResult:
    """Resultado de la extracción de intención del usuario"""
    intent_type: str = "general_chat"  # Puede ser: "booking", "info", "support", "lead", "general_chat"
    destination: Optional[str] = None
    duration: Optional[str] = None
    group_type: Optional[str] = None
    group_size: Optional[int] = None
    budget_range: Optional[str] = None
    interests: Optional[List[str]] = None
    departure_month: Optional[str] = None
    confidence_score: float = 0.0
    fields_detected: int = 0
    needs_clarification: bool = False
    clarification_question: Optional[str] = None


# Esquema JSON para structured outputs
INTENT_SCHEMA = {
    "type": "object",
    "properties": {
        "intent_type": {"type": "string", "enum": ["booking", "info", "support", "lead", "general_chat"]},
        "destination": {"type": "string", "nullable": True},
        "duration": {"type": "string", "nullable": True},
        "group_type": {"type": "string", "enum": ["familiar", "pareja", "amigos", "escolar", "corporativo", None], "nullable": True},
        "group_size": {"type": "integer", "minimum": 1, "maximum": 100, "nullable": True},
        "budget_range": {"type": "string", "enum": ["economico", "mid-range", "premium", None], "nullable": True},
        "interests": {"type": "array", "items": {"type": "string"}, "nullable": True},
        "departure_month": {"type": "string", "nullable": True},
        "confidence_score": {"type": "number", "minimum": 0, "maximum": 1},
        "fields_detected": {"type": "integer", "minimum": 0, "maximum": 8},
        "needs_clarification": {"type": "boolean"},
        "clarification_question": {"type": "string", "nullable": True}
    },
    "required": ["confidence_score", "fields_detected", "needs_clarification"]
}


class IntentEngine:
    """Motor de extracción de intenciones de viaje"""

    def __init__(self):
        self.min_confidence = 0.70
        self.min_fields = 3

    def _coerce_scalar(self, value):
        if isinstance(value, (list, tuple)):
            return value[0] if value else None
        return value

    def _to_float(self, value, default: float = 0.0) -> float:
        value = self._coerce_scalar(value)
        if value is None:
            return default
        if isinstance(value, bool):
            return float(value)
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _to_int(self, value, default: int = 0) -> int:
        value = self._coerce_scalar(value)
        if value is None:
            return default
        if isinstance(value, bool):
            return int(value)
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return default

    def detect_language(self, text: str) -> str:
        """Detecta idioma permitido: es | en | pt"""
        if not text:
            return "es"
        t = text.lower()
        if any(w in t for w in (" you ", " your ", " trip", "travel", "booking", "hello", "hi ")):
            return "en"
        if any(w in t for w in (" você", " viagem", "praia", "olá", "obrigado", "reservar")):
            return "pt"
        return "es"

    def extract_intent(self, messages: list, language: str = "es") -> IntentResult:
        """Extrae intención usando el cliente LLM y luego normaliza el JSON."""
        try:
            raw_json = openrouter_client.extract_intent(messages, language)
        except Exception:
            try:
                prompt = (
                    "Extrae la intención del usuario y responde SOLO en JSON con estas claves:\n"
                    "intent_type, destination, duration, group_type, group_size, budget_range, "
                    "interests, departure_month, confidence_score, fields_detected, "
                    "needs_clarification, clarification_question.\n"
                    "No agregues texto fuera del JSON."
                )
                raw_json = openrouter_client.chat(
                    messages=[{"role": "system", "content": prompt}] + list(messages or []),
                    task_type="fast",
                    temperature=0.2,
                )
            except Exception:
                return self._fallback_result(language)

        return self.parse_intent(raw_json, language)

    def _build_conversation_context(self, messages: list) -> str:
        if not messages:
            return ""

        formatted = []
        for message in list(messages)[-10:]:
            role = str(message.get("role", "user")).upper()
            content = str(message.get("content", "")).strip()
            if content:
                formatted.append(f"{role}: {content}")
        return "\n".join(formatted)

    def parse_intent(self, raw_json: str, language: str = "es") -> IntentResult:
        try:
            # Clean markdown codeblocks if LLM includes them
            cleaned_json = raw_json.strip()
            if cleaned_json.startswith("```json"):
                cleaned_json = cleaned_json[7:]
            elif cleaned_json.startswith("```"):
                cleaned_json = cleaned_json[3:]
            if cleaned_json.endswith("```"):
                cleaned_json = cleaned_json[:-3]
            cleaned_json = cleaned_json.strip()

            data = json.loads(cleaned_json or "{}")
        except Exception:
            return self._fallback_result(language)

        # Heurística simple para determinar el intent_type si el LLM no lo puso
        intent_type = data.get("intent_type")
        if not intent_type or intent_type == "travel_search":
            if data.get("destination") or data.get("departure_month") or data.get("budget_range"):
                intent_type = "booking"
            else:
                intent_type = "general_chat"

        result = IntentResult(
            intent_type=intent_type,
            destination=data.get("destination") or None,
            duration=data.get("duration") or None,
            group_type=data.get("group_type") or None,
            group_size=self._to_int(data.get("group_size"), default=0) or None,
            budget_range=data.get("budget_range") or None,
            interests=data.get("interests"),
            departure_month=data.get("departure_month") or None,
            confidence_score=self._to_float(data.get("confidence_score") or 0.0),
            fields_detected=self._to_int(data.get("fields_detected") or 0),
            needs_clarification=bool(data.get("needs_clarification") or False),
            clarification_question=data.get("clarification_question") or None,
        )

        # Solo forzar clarificación si es un booking Y le faltan datos críticos.
        # Si es un general_chat o lead, no forzamos clarificación estricta.
        if result.intent_type == "booking":
            # Consideramos un viaje viable si al menos tiene destino o mes y un par de campos más.
            # Reducimos la exigencia para evitar bucles.
            if result.confidence_score < 0.50 or result.fields_detected < 2:
                result.needs_clarification = True
                if not result.clarification_question:
                    result.clarification_question = self._generate_clarification_question(result, language)
        return result

    def _fallback_result(self, language: str) -> IntentResult:
        return IntentResult(
            confidence_score=0.0,
            fields_detected=0,
            needs_clarification=True,
            clarification_question=self._get_default_clarification(language),
        )

    def _generate_clarification_question(self, result: IntentResult, language: str) -> str:
        """Genera pregunta de clarificación basada en campos faltantes"""
        
        questions = {
            'es': {
                'destination': "¿A qué destino te gustaría viajar?",
                'duration': "¿Cuánto tiempo te gustaría que durara el viaje?",
                'group_type': "¿Con quién viajarás? (familia, pareja, amigos, etc.)",
                'group_size': "¿Cuántas personas serán en total?",
                'budget_range': "¿Qué rango de presupuesto manejas? (económico, medio, premium)",
                'interests': "¿Qué tipo de actividades te interesan? (playa, montaña, cultura, etc.)",
                'departure_month': "¿En qué mes te gustaría viajar?"
            },
            'en': {
                'destination': "Where would you like to travel?",
                'duration': "How long would you like the trip to last?",
                'group_type': "Who will you be traveling with? (family, couple, friends, etc.)",
                'group_size': "How many people will there be in total?",
                'budget_range': "What budget range are you considering? (economical, mid-range, premium)",
                'interests': "What type of activities interest you? (beach, mountain, culture, etc.)",
                'departure_month': "In which month would you like to travel?"
            },
            'pt': {
                'destination': "Para onde você gostaria de viajar?",
                'duration': "Quanto tempo você gostaria que durasse a viagem?",
                'group_type': "Com quem você vai viajar? (família, casal, amigos, etc.)",
                'group_size': "Quantas pessoas serão no total?",
                'budget_range': "Qual faixa de orçamento você está considerando? (econômico, médio, premium)",
                'interests': "Que tipo de atividades te interessam? (praia, montanha, cultura, etc.)",
                'departure_month': "Em qual mês você gostaria de viajar?"
            }
        }
        
        lang_questions = questions.get(language, questions['es'])
        
        # Identificar campos faltantes
        missing_fields = []
        if not result.destination:
            missing_fields.append('destination')
        if not result.duration:
            missing_fields.append('duration')
        if not result.group_type:
            missing_fields.append('group_type')
        if not result.group_size:
            missing_fields.append('group_size')
        if not result.budget_range:
            missing_fields.append('budget_range')
        if not result.interests:
            missing_fields.append('interests')
        if not result.departure_month:
            missing_fields.append('departure_month')
        
        # Seleccionar pregunta para el primer campo faltante
        if missing_fields:
            return lang_questions.get(missing_fields[0], lang_questions['destination'])
        
        return lang_questions['destination']
    
    def _get_default_clarification(self, language: str) -> str:
        """Pregunta de clarificación por defecto"""
        questions = {
            'es': "¿Podrías contarme más sobre el viaje que estás buscando?",
            'en': "Could you tell me more about the trip you're looking for?",
            'pt': "Você poderia me contar mais sobre a viagem que está procurando?"
        }
        return questions.get(language, questions['es'])


# Instancia global del motor
intent_engine = IntentEngine()
