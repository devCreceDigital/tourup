# Spec 03 — Intent Engine

> SSD: Define el contrato del motor de intención. Implementar en `services/intent_engine.py`.

---

## Propósito

Extraer intención estructurada de una conversación libre para activar el RAG Engine cuando hay suficiente contexto.

---

## Contrato de la función principal

```python
def extract_intent(messages: list[dict], language: str = "es") -> IntentResult:
    """
    messages: lista de {"role": "user"|"assistant", "content": str}
    language: "es" | "en" | "pt"
    """
```

**`IntentResult` (dataclass):**
```python
@dataclass
class IntentResult:
    destination:            str | None
    duration:               str | None
    group_type:             str | None   # familiar|pareja|amigos|escolar|corporativo
    group_size:             int | None
    budget_range:           str | None   # economico|mid-range|premium
    interests:              list[str]    # aventura|cultura|relax|gastronomia|naturaleza
    departure_month:        str | None
    confidence_score:       float        # 0.0 → 1.0
    fields_detected:        int
    needs_clarification:    bool
    clarification_question: str | None
```

---

## Regla de activación RAG

```
fields_detected >= 3  AND  confidence_score >= 0.70  →  activar RAG Engine
de lo contrario                                      →  retornar clarification_question
```

---

## Llamada a OpenRouter (structured outputs)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
    default_headers={
        "HTTP-Referer": settings.OPENROUTER_APP_URL,
        "X-Title":      settings.OPENROUTER_APP_TITLE,
    }
)

response = client.chat.completions.create(
    model="openai/gpt-4o-mini",
    messages=build_intent_prompt(messages, language),
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "travel_intent",
            "strict": True,
            "schema": INTENT_SCHEMA  # ver abajo
        }
    },
    temperature=0.1,
    max_tokens=500
)
```

**INTENT_SCHEMA:**
```python
INTENT_SCHEMA = {
    "type": "object",
    "properties": {
        "destination":            {"type": ["string", "null"]},
        "duration":               {"type": ["string", "null"]},
        "group_type":             {"type": ["string", "null"]},
        "group_size":             {"type": ["integer", "null"]},
        "budget_range":           {"type": ["string", "null"]},
        "interests":              {"type": "array", "items": {"type": "string"}},
        "departure_month":        {"type": ["string", "null"]},
        "confidence_score":       {"type": "number", "minimum": 0, "maximum": 1},
        "fields_detected":        {"type": "integer"},
        "needs_clarification":    {"type": "boolean"},
        "clarification_question": {"type": ["string", "null"]}
    },
    "required": [
        "confidence_score", "fields_detected",
        "needs_clarification", "interests"
    ]
}
```

---

## System prompt

```
Eres un extractor de intención de viaje. Analiza la conversación y extrae los campos
de intención del viajero en JSON estricto.

Campos a extraer: destination, duration, group_type, group_size, budget_range,
interests (array), departure_month.

confidence_score: 0.0-1.0 según certeza de los datos extraídos.
fields_detected: número de campos con valor no nulo.

Si needs_clarification es true, genera clarification_question en idioma {language}
pidiendo el dato más importante que falta. Sé breve y natural.

Nunca inventes datos. Si no aparece en la conversación, usa null.
```

---

## Criterios de aceptación — 20 tests obligatorios

Archivo: `backend/apps/asistente_ia/tests/test_intent_engine.py`

| # | Entrada del usuario | Resultado esperado |
|---|--------------------|--------------------|
| 1 | "Quiero ir a Perú" | destination="Perú", needs_clarification=True |
| 2 | "Perú 10 días familia 4 julio mid-range cultura naturaleza" | fields_detected≥6, needs_clarification=False |
| 3 | "I want to go to Peru in July" | clarification_question en inglés |
| 4 | "Quiero un viaje bonito" | confidence_score < 0.30, needs_clarification=True |
| 5 | "Luna de miel Bali 7 días" | group_type="pareja" |
| 6 | "Viaje escolar secundaria 30 alumnos" | group_type="escolar", group_size=30 |
| 7 | "Sin restricciones de presupuesto" | budget_range="premium" |
| 8 | "Económico, mochilero" | budget_range="economico" |
| 9 | "Cusco y Machu Picchu" | destination contiene "Cusco" |
| 10 | "Semana santa" | departure_month referencia a marzo/abril |
| 11 | "Somos 2 parejas" | group_size=4, group_type="pareja" |
| 12 | "Aventura y trekking" | interests incluye "aventura" |
| 13 | "Queremos descansar en la playa" | interests incluye "relax" |
| 14 | Conversación 8 turnos completa | needs_clarification=False, fields_detected≥5 |
| 15 | "Viagem para o Brasil em dezembro" | idioma detectado=PT |
| 16 | Mensaje con typos "Machupicchu peruu" | destination extraído correctamente |
| 17 | Solo número "4" (sin contexto) | confidence_score < 0.20 |
| 18 | "Corporativo 20 ejecutivos" | group_type="corporativo" |
| 19 | "Unos 10 días más o menos" | duration="10 días" |
| 20 | Conversación mezclada ES+EN | clarification_question en idioma predominante |

Cobertura mínima: 100% de los 20 casos pass.
