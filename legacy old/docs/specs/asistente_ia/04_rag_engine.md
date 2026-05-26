# Spec 04 — RAG Engine

> SSD: Define el motor de búsqueda semántica sobre el catálogo. Implementar en `services/rag_engine.py`.

---

## Propósito

Dado un `IntentResult` con contexto suficiente, buscar en pgvector los viajes del catálogo ToTem HUB que mejor coinciden. Retorna máximo 3 opciones rankeadas por `match_score`.

---

## Contrato de la función principal

```python
def search_matches(intent: IntentResult, limit: int = 3) -> list[MatchResult]:
    """
    intent: IntentResult con fields_detected >= 3 y confidence_score >= 0.70
    limit:  máximo de resultados (MVP = 3)
    Retorna lista de MatchResult ordenada por match_score DESC
    """
```

**`MatchResult` (dataclass):**
```python
@dataclass
class MatchResult:
    trip_id:         str
    itinerary_id:    str
    agency_name:     str
    agency_rating:   float | None
    trip_name:       str
    duration_days:   int
    next_departure:  str    # "YYYY-MM-DD"
    price_from:      float
    currency:        str    # "USD" | "EUR" | "PEN"
    available_seats: int
    match_score:     float  # score final combinado 0.0-1.0
    semantic_score:  float  # similitud coseno del embedding
    highlights:      list[str]  # 2-3 frases clave del itinerario
```

---

## Pipeline de matching

```
1. build_query_text(intent)     → texto compuesto de la intención
2. openrouter_embed(texto)      → vector(1536)
3. pgvector search              → 20 candidatos ordenados por similitud coseno
4. calcular match_score final   → combinar semantic + availability + plan
5. retornar top 3
```

---

## Texto de consulta para embedding

```python
def build_query_text(intent: IntentResult) -> str:
    parts = []
    if intent.destination:     parts.append(f"Destino: {intent.destination}")
    if intent.duration:        parts.append(f"Duración: {intent.duration}")
    if intent.group_type:      parts.append(f"Grupo: {intent.group_type}")
    if intent.budget_range:    parts.append(f"Presupuesto: {intent.budget_range}")
    if intent.interests:       parts.append(f"Intereses: {', '.join(intent.interests)}")
    if intent.departure_month: parts.append(f"Período: {intent.departure_month}")
    return ". ".join(parts)
```

---

## Query pgvector

```sql
SELECT
  v.id            AS trip_id,
  v.nombre        AS trip_name,
  v.cupos         AS available_seats,
  v.fecha_inicio  AS next_departure,
  i.id            AS itinerary_id,
  c.nombre        AS agency_name,
  1 - (i.embedding <=> %(query_vector)s) AS semantic_score
FROM viajes v
JOIN itinerarios i ON i.id = v.itinerario_id
JOIN companies   c ON c.id = v.company_id
WHERE v.status = 'publicado'
  AND v.cupos > 0
  AND i.embedding IS NOT NULL
ORDER BY i.embedding <=> %(query_vector)s
LIMIT 20;
```

Ejecutar vía `django.db.connection.cursor()` con vector como parámetro.

---

## Fórmulas de score

```python
def availability_score(seats: int, group_size: int | None) -> float:
    if group_size and seats >= group_size: return 1.0
    if seats > 5:  return 0.8
    if seats > 0:  return 0.5
    return 0.0

def plan_score(company_plan: str) -> float:
    return {"premium": 1.0, "standard": 0.7, "basic": 0.4}.get(company_plan, 0.5)

def final_match_score(semantic, availability, plan) -> float:
    return (semantic * 0.60) + (availability * 0.25) + (plan * 0.15)
```

---

## Script de embeddings iniciales

Archivo: `backend/apps/asistente_ia/scripts/embed_batch.py`

```
Uso: python manage.py shell < apps/asistente_ia/scripts/embed_batch.py

Flujo:
  1. Cargar itinerarios con embedding IS NULL
  2. Construir texto compuesto (spec 02)
  3. openrouter_embed() en lotes de 50
  4. UPDATE itinerarios SET embedding=..., embedding_updated_at=NOW()
  5. Registrar en asistente_ia_embeddings_log
  Repetir para viajes con status='publicado' y cupos > 0
```

---

## Criterios de aceptación

- [ ] Vector search retorna resultados en < 500ms (catálogo de 1000 itinerarios)
- [ ] `match_score` siempre en rango [0.0, 1.0]
- [ ] Solo retorna viajes `status=publicado` con `cupos > 0`
- [ ] Si ningún resultado supera score 0.50, retorna lista vacía
- [ ] Test: 5 intents de prueba verifican que top-1 sea el resultado esperado
