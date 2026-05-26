"""
Intent Agent.
Detects user intent and language.
"""
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState
from apps.asistente_ia.ai.parsers.response_parser import IntentResult

class IntentAgent(BaseAgent):
    def __init__(self, intent_engine, llm_client):
        self.intent_engine = intent_engine
        self.llm = llm_client

    def execute(self, state: OrchestratorState) -> OrchestratorState:
        msg = (state.user_message or "").strip()
        lowered = msg.lower()

        # 1. Update Language if not set (or detect from new message)
        detected_lang = self.intent_engine.detect_language(state.user_message)
        if detected_lang:
            state.language = detected_lang

        if lowered in {"dentro del país", "dentro del pais"}:
            state.intent = IntentResult(
                intent_type="booking",
                destination="Perú",
                confidence_score=0.95,
                fields_detected=1,
                needs_clarification=False,
            )
            return state
        if lowered in {"sudamérica", "sudamerica"}:
            state.intent = IntentResult(
                intent_type="booking",
                destination="Sudamérica",
                confidence_score=0.95,
                fields_detected=1,
                needs_clarification=False,
            )
            return state
        if lowered in {"me da igual el destino", "me da igual"}:
            state.intent = IntentResult(
                intent_type="booking",
                destination="Flexible",
                confidence_score=0.80,
                fields_detected=1,
                needs_clarification=False,
            )
            return state
        if lowered in {"perú", "peru", "colombia", "chile", "argentina"}:
            state.intent = IntentResult(
                intent_type="booking",
                destination=msg,
                confidence_score=0.95,
                fields_detected=1,
                needs_clarification=False,
            )
            return state
        if lowered in {"costa", "sierra", "selva"}:
            state.intent = IntentResult(
                intent_type="booking",
                destination=f"Perú {msg}",
                confidence_score=0.90,
                fields_detected=1,
                needs_clarification=False,
            )
            return state

        # 2. Extract intent using LLM
        intent_prompt = (
            "Extrae la intención del usuario y responde SOLO en JSON con estas claves:\n"
            "intent_type (booking, info, support, lead, general_chat), destination, duration, group_type, group_size, budget_range, interests, departure_month,\n"
            "confidence_score (0 a 1), fields_detected (0 a 8), needs_clarification (true/false), clarification_question.\n"
            "No agregues texto fuera del JSON."
        )
        
        try:
            # We use only the last 8 messages for intent detection to save context
            context_messages = state.chat_history[-8:] if state.chat_history else []
            if not context_messages or context_messages[-1]["content"] != state.user_message:
                 context_messages.append({"role": "user", "content": state.user_message})

            intent_json = self.llm.chat(
                messages=[{"role": "system", "content": intent_prompt}] + context_messages,
                task_type="main", # Fix missing argument error in OpenRouterClient
                temperature=0.2,
            )
        except Exception as e:
            print(f">>> [IntentAgent] Intent extraction failed: {e}")
            intent_json = "{}"

        # 3. Parse intent
        state.intent = self.intent_engine.parse_intent(intent_json, state.language)

        # 4. Merge with accumulated intent from previous turns
        acc = state.accumulated_intent
        if acc and state.intent:
            intent = state.intent
            if not getattr(intent, "destination", None) and acc.get("destination"):
                intent.destination = acc["destination"]
            if not getattr(intent, "duration", None) and acc.get("duration"):
                intent.duration = acc["duration"]
            if not getattr(intent, "group_size", None) and acc.get("group_size"):
                intent.group_size = acc["group_size"]
            if not getattr(intent, "group_type", None) and acc.get("group_type"):
                intent.group_type = acc["group_type"]
            if not getattr(intent, "budget_range", None) and acc.get("budget_range"):
                intent.budget_range = acc["budget_range"]
            if not getattr(intent, "interests", None) and acc.get("interests"):
                intent.interests = acc["interests"]
            if not getattr(intent, "departure_month", None) and acc.get("departure_month"):
                intent.departure_month = acc["departure_month"]

        return state
