# Spec 05 — API Endpoints

> SSD: 3 endpoints únicamente. Implementar en `views.py` + `urls.py` del módulo.

---

## Registro de URLs

```python
# backend/apps/asistente_ia/urls.py
urlpatterns = [
    path("sessions/",                     CreateSessionView.as_view(), name="create-session"),
    path("sessions/<uuid:pk>/message/",   MessageView.as_view(),       name="send-message"),
    path("leads/",                        CreateLeadView.as_view(),     name="create-lead"),
]

# backend/totem_backend/urls.py — agregar línea:
path("api/asistente-ia/", include("apps.asistente_ia.urls")),
```

---

## Endpoint 1 — Crear sesión

```
POST /api/asistente-ia/sessions/
Auth: ninguna (anónimo)
Rate limit: 5 sesiones/hora por IP
```

**Request:** `{}`

**Response 201:**
```json
{
  "session_id":      "uuid",
  "session_token":   "64-char-hex-string",
  "welcome_message": "Hola, soy Asistente IA. Cuéntame tu idea de viaje...",
  "language":        "es",
  "expires_at":      "2026-05-06T10:00:00Z"
}
```

**Response 429:** Rate limit excedido.

---

## Endpoint 2 — Enviar mensaje (SSE streaming)

```
POST /api/asistente-ia/sessions/{session_id}/message/
Auth: ninguna (session_token en body)
Rate limit: 10 mensajes/hora por IP
Content-Type response: text/event-stream
```

**Request:**
```json
{
  "session_token": "64-char-hex-string",
  "content":       "Quiero ir a Perú en julio con mi familia"
}
```

**Eventos SSE:**
```
data: {"type": "token",        "content": "¡Perú en julio"}
data: {"type": "matches",      "data": [{...MatchResult...}]}
data: {"type": "clarification","question": "¿Cuántos días aproximadamente?"}
data: {"type": "intent",       "data": {...intent_data...}}
data: {"type": "done"}
data: {"type": "error",        "message": "descripción genérica"}
```

| Evento | Cuándo | Contenido |
|--------|--------|-----------|
| `token` | Durante stream LLM | texto parcial |
| `matches` | RAG tiene resultados | lista ≤ 3 MatchResult |
| `clarification` | needs_clarification=True | pregunta sugerida |
| `intent` | Al cerrar stream | intent_data completo |
| `done` | Fin del stream | `{}` |
| `error` | Error interno | mensaje genérico |

**Response 400:** session_token inválido o sesión expirada.
**Response 429:** Rate limit excedido.

---

## Endpoint 3 — Crear lead

```
POST /api/asistente-ia/leads/
Auth: ninguna (session_token en body)
Rate limit: 3 leads/hora por IP
```

**Request:**
```json
{
  "session_token":  "64-char-hex-string",
  "company_id":     "uuid-agencia",
  "trip_id":        "uuid-viaje",
  "match_score":    0.94,
  "traveler_name":  "Nombre Apellido",
  "traveler_email": "correo@ejemplo.com",
  "traveler_msg":   "¿Incluye traslados?"
}
```

**Response 201:**
```json
{
  "lead_id":    "uuid",
  "message":    "Tu consulta fue enviada. La agencia te responderá en menos de 4 horas.",
  "created_at": "2026-05-05T14:32:00Z"
}
```

**Response 400:** Validación fallida.
**Response 404:** `company_id` o `trip_id` no existe.
**Response 409:** Ya existe lead de esta sesión para esta agencia.

---

## Rate Limiting (Redis)

```python
# permissions.py
RATE_LIMITS = {
    "create_session": ("5/hour", "asistente_ia:rl:session:{ip}"),
    "send_message":   ("10/hour", "asistente_ia:rl:msg:{ip}"),
    "create_lead":    ("3/hour",  "asistente_ia:rl:lead:{ip}"),
}
```

---

## Validaciones de seguridad

- `session_token`: 64 chars hex, debe existir en DB y no estar expirado
- `traveler_email`: validar con `EmailValidator` de Django
- `company_id` / `trip_id`: deben existir y estar activos
- `content`: max 1000 chars, strip HTML tags
- `traveler_msg`: max 500 chars, strip HTML tags
- Ningún endpoint expone stack traces al cliente
