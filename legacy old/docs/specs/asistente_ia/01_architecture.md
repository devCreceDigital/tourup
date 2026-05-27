# Spec 01 — Arquitectura del Módulo Asistente IA

> SSD: Esta spec define la estructura interna del módulo. No implementar nada fuera de este contrato.

---

## Ubicación en el monorepo

```
totem-mvp1/
├── backend/
│   └── apps/
│       └── asistente_ia/          ← NUEVA Django app
│           ├── __init__.py
│           ├── apps.py
│           ├── models.py           (sesiones + leads)
│           ├── views.py            (3 views: session, message SSE, lead)
│           ├── serializers.py
│           ├── urls.py
│           ├── permissions.py      (rate limiting anónimo por IP)
│           ├── services/
│           │   ├── openrouter.py   (cliente OpenRouter)
│           │   ├── intent_engine.py
│           │   ├── rag_engine.py
│           │   ├── conversation.py (Redis multi-turno)
│           │   └── lead_notifier.py (email Resend)
│           ├── scripts/
│           │   └── embed_batch.py  (generar embeddings iniciales)
│           └── tests/
│               ├── test_intent_engine.py
│               ├── test_rag_engine.py
│               └── test_api.py
└── frontend/
    ├── app/
    │   ├── asistente-ia/           ← NUEVA ruta pública (sin auth)
    │   │   └── page.tsx            (Chat Discovery)
    │   └── (backoffice)/
    │       └── asistente-ia/
    │           └── leads/
    │               └── page.tsx    (Panel de leads agencia)
    └── components/
        └── asistente-ia/
            ├── ChatThread.tsx
            ├── MessageComposer.tsx
            ├── AgencyMatchCard.tsx
            ├── AIFollowUpCard.tsx
            └── LeadForm.tsx
```

---

## Flujo de datos completo

```
[Viajero] → POST /api/asistente-ia/sessions
                ↓
           Crea registro en asistente_ia_sessions (Supabase)
           Inicializa contexto vacío en Redis (TTL 24h)
                ↓
           ← { session_token, welcome_message }

[Viajero] → POST /api/asistente-ia/sessions/:id/message  (SSE)
                ↓
           1. Rate limit check: IP ≤ 10 msgs/hora
           2. ConversationManager.add_message(Redis)
           3. IntentEngine.extract(messages) → intent_data + confidence
           4a. confidence < 0.70 en < 3 campos:
               → LLM genera pregunta de clarificación (stream tokens)
           4b. confidence ≥ 0.70 en ≥ 3 campos:
               → RAGEngine.search(intent_data) → top 3 matches
               → LLM genera respuesta con matches (stream tokens)
           5. ConversationManager.save_intent(Redis + DB)
           6. Stream SSE → frontend

[Viajero] → POST /api/asistente-ia/leads
                ↓
           1. Valida session_token + company_id + email viajero
           2. Crea registro asistente_ia_leads (Supabase)
           3. LeadNotifier.send(company) → Resend email a agencia
           ← { lead_id, message: "Agencia responderá en < 4 horas" }
```

---

## Integración con apps existentes (solo lectura)

| App origen | Modelos usados | Para qué |
|-----------|---------------|---------|
| `apps/viajes` | `Viaje` (status=publicado, cupos>0) | RAG: fuente de viajes disponibles |
| `apps/itinerarios` | `Itinerario`, `DiaItinerario` | RAG: contenido semántico para embedding |
| `apps/catalogo` | `Destino` | RAG: fichas de destino |
| `apps/usuarios` | `Perfil` (rol=admin) | Backoffice: autenticar agencia en panel leads |

**Regla:** `asistente_ia` importa de otras apps. Ninguna app importa de `asistente_ia`.

---

## OpenRouter — configuración

```python
# services/openrouter.py
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

INTENT_MODEL    = "openai/gpt-4o-mini"             # structured outputs JSON
CHAT_MODEL      = "openai/gpt-4o-mini"             # conversación + streaming
EMBEDDING_MODEL = "openai/text-embedding-3-small"  # 1536 dimensiones

# El SDK openai Python se usa con base_url apuntando a OpenRouter
# Requiere header HTTP-Referer y X-Title
```

**Variables de entorno nuevas en `backend/.env`:**
```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_APP_URL=https://totemhub.com
OPENROUTER_APP_TITLE=ToTem HUB Asistente IA
```

---

## Redis — estructura de claves

```
asistente_ia:session:{token}:messages  → lista JSON de mensajes (TTL 24h)
asistente_ia:session:{token}:intent    → JSON intent_data más reciente (TTL 24h)
asistente_ia:session:{token}:lang      → "es"|"en"|"pt" (TTL 24h)
asistente_ia:ratelimit:{ip_hash}       → contador mensajes (TTL 1h)
```

---

## Restricciones de implementación

- NO crear comunicación HTTP entre `asistente_ia` y otras apps. Solo imports Python.
- NO usar WebSockets. Solo SSE nativo.
- NO requerir autenticación del viajero. Session token UUID anónimo.
- NO usar `managed=True` en modelos. Tablas creadas vía script SQL en Supabase.
- NO modificar modelos de otras apps. Solo `ALTER TABLE` para columnas `embedding`.
