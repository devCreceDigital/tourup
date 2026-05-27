# Sprints Diarios — Asistente IA
## Distribución del equipo (5 días)

> **Regla de inicio:** Antes de trabajar cada día, copia el **Prompt de Inicio de Sesión**
> de tu sección e identifícate como A, B o C. Claude Code usará ese contexto durante toda la sesión.

---

## Roles

| Dev | Perfil | Foco principal |
|-----|--------|---------------|
| **A** | Backend | Infraestructura, BD, APIs, deploy, Redis |
| **B** | Backend IA | LLM, Intent Engine, RAG Engine, tests |
| **C** | Full Stack | Frontend Next.js + endpoints backoffice agencia |

---

## PROMPT BASE DE INICIO (personalizar con tu letra cada día)

```
Soy el desarrollador [A / B / C] del equipo ToTem HUB trabajando en el módulo Asistente IA.

CONTEXTO DEL PROYECTO:
- Repo: totem-mvp1 — monorepo Django + Next.js
- Módulo nuevo: apps/asistente_ia/ (Django app, modular monolith)
- Specs SSD: docs/specs/asistente_ia/ — LEER antes de implementar cualquier cosa
- Backend: Django + DRF, Supabase PostgreSQL (managed=False), Redis
- Frontend: Next.js 15 App Router, React 19, TypeScript estricto, Tailwind CSS
- LLM: OpenRouter API (SDK openai Python con base_url a OpenRouter)
  Modelo Intent: openai/gpt-4o-mini | Embeddings: openai/text-embedding-3-small
- Auth: Supabase JWT — NUNCA Django sessions ni request.user nativo
- Regla clave: NO usar manage.py migrate — tablas vía script SQL en Supabase

ARCHIVOS DE REFERENCIA ANTES DE CODIFICAR:
  docs/specs/asistente_ia/README.md        → visión general y fases
  docs/specs/asistente_ia/01_architecture.md → estructura del módulo
  CONTEXT.md                               → stack y design system
  AGENTS.md                                → reglas del proyecto

Mi tarea de hoy: [PEGAR LA TAREA DEL DÍA DE TU SECCIÓN ABAJO]
```

---
---

# DÍA 1 — Base IA

## ═══ DEV A — Infraestructura de BD ═══

### Tareas del día
- [ ] Habilitar extensión `pgvector` en Supabase SQL Editor
- [ ] Crear archivo `backend/scripts/asistente_ia_setup.sql` con el SQL completo
- [ ] Ejecutar el script: 3 tablas nuevas + 2 ALTER TABLE + índices HNSW
- [ ] Verificar con SELECT que `itinerarios.embedding` y `viajes.embedding` existen
- [ ] Confirmar con Dev B que los modelos Django coinciden con el schema

### Prompt Día 1 — Dev A
```
Soy el desarrollador A (Backend — infraestructura) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/02_database_schema.md  ← TODO el SQL está aquí
  CONTEXT.md §5 (modelos existentes: viajes, itinerarios)

Tarea:
1. Generar backend/scripts/asistente_ia_setup.sql con:
   - CREATE EXTENSION IF NOT EXISTS vector
   - Tabla asistente_ia_sessions (campos exactos de spec 02)
   - Tabla asistente_ia_leads (campos exactos de spec 02)
   - Tabla asistente_ia_embeddings_log
   - ALTER TABLE itinerarios ADD COLUMN IF NOT EXISTS embedding vector(1536)
   - ALTER TABLE viajes ADD COLUMN IF NOT EXISTS embedding vector(1536)
   - Índices HNSW con vector_cosine_ops en ambas tablas
   - Todos los CREATE INDEX con IF NOT EXISTS

2. El script debe ser idempotente (re-ejecutable sin romper nada).
3. NO usar manage.py migrate.

Muéstrame el script SQL completo.
```

---

## ═══ DEV B — Modelos Django + Endpoint sesión ═══

### Tareas del día
- [ ] Crear estructura `backend/apps/asistente_ia/` con todos los archivos base
- [ ] `models.py`: `AsistenteIaSession` y `AsistenteIaLead` (managed=False, UUID PK)
- [ ] `serializers.py` para ambos modelos
- [ ] `POST /api/asistente-ia/sessions/` → crea sesión anónima, retorna welcome_message
- [ ] Registrar en `INSTALLED_APPS` y en `totem_backend/urls.py`

### Prompt Día 1 — Dev B
```
Soy el desarrollador B (Backend IA) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/01_architecture.md  ← estructura de carpetas
  docs/specs/asistente_ia/02_database_schema.md  ← campos de los modelos
  docs/specs/asistente_ia/05_api_spec.md §Endpoint 1  ← contrato de respuesta
  AGENTS.md §Backend (UUID PK, managed=False, auth JWT, RBAC)

Tarea:
1. Crear apps/asistente_ia/ con:
   __init__.py, apps.py, models.py, serializers.py, views.py, urls.py, permissions.py

2. models.py — AsistenteIaSession y AsistenteIaLead:
   - managed = False (tablas las crea Dev A en Supabase)
   - UUID PK con default=uuid.uuid4
   - Campos exactos de spec 02

3. POST /api/asistente-ia/sessions/:
   - Sin autenticación (anónimo)
   - Crea registro en AsistenteIaSession con session_token = secrets.token_hex(32)
   - Retorna: {session_id, session_token, welcome_message, language, expires_at}
   - welcome_message: "Hola, soy Asistente IA. Cuéntame tu idea de viaje..."

4. Registrar: INSTALLED_APPS += ['apps.asistente_ia'] y
   path('api/asistente-ia/', include('apps.asistente_ia.urls'))

Referencia de patrón: apps/viajes/views.py y apps/viajes/serializers.py
```

---

## ═══ DEV C — Setup Frontend ═══

### Tareas del día
- [ ] Crear `frontend/app/asistente-ia/page.tsx` (Server Component shell)
- [ ] Agregar `/asistente-ia` como ruta pública en `middleware.ts`
- [ ] Crear carpeta `components/asistente-ia/` con archivos vacíos de cada componente
- [ ] Definir todos los tipos TypeScript en `frontend/types/index.ts`
- [ ] Crear `frontend/hooks/useChatSession.ts` con la interface del estado (sin lógica aún)

### Prompt Día 1 — Dev C
```
Soy el desarrollador C (Full Stack) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/06_frontend_spec.md  ← árbol de componentes y props
  docs/specs/asistente_ia/01_architecture.md §Frontend  ← estructura de carpetas
  CONTEXT.md §8  ← design system (tokens de color OBLIGATORIOS)
  AGENTS.md §Frontend (App Router, TypeScript estricto, Lucide icons)

Tarea:
1. app/asistente-ia/page.tsx — Server Component vacío con import de ChatDiscovery

2. middleware.ts — agregar /asistente-ia a rutas públicas (sin JWT requerido)

3. Crear archivos vacíos con sus interfaces en components/asistente-ia/:
   ChatDiscovery.tsx, ChatHeader.tsx, ChatThread.tsx,
   UserMessage.tsx, AssistantMessage.tsx,
   AgencyMatchCard.tsx, AIFollowUpCard.tsx,
   MessageComposer.tsx, LeadForm.tsx

4. En frontend/types/index.ts — agregar tipos:
   ChatMessage, MatchResult, LeadFormData, LeadRecord, LeadStatus
   (contratos exactos de spec 06)

5. hooks/useChatSession.ts — solo la interface y estado inicial:
   sessionId, sessionToken, messages, isStreaming, error
   Funciones vacías: initSession, sendMessage, submitLead

Sin lógica todavía — solo estructura, tipos y shells de componentes.
Tokens de color de CONTEXT.md §8 siempre, nunca valores hardcodeados.
```

---
---

# DÍA 2 — Intent Engine

## ═══ DEV A — Conversation Manager + Rate Limiting ═══

### Tareas del día
- [ ] `services/conversation.py`: clase `ConversationManager` con Redis
- [ ] Métodos: `add_message()`, `get_messages()`, `save_intent()`, `get_language()`
- [ ] Claves Redis con TTL 24h (estructura de spec 01)
- [ ] `permissions.py`: `AnonRateThrottle` con contadores Redis por IP

### Prompt Día 2 — Dev A
```
Soy el desarrollador A (Backend — infraestructura) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/01_architecture.md §Redis  ← estructura de claves exacta
  docs/specs/asistente_ia/05_api_spec.md §Rate Limiting

Tarea:
1. services/conversation.py — clase ConversationManager:
   add_message(session_token, role, content) → None
     → RPUSH asistente_ia:session:{token}:messages + EXPIRE 24h
   get_messages(session_token) → list[dict]
   save_intent(session_token, intent_data: dict) → None
     → SET asistente_ia:session:{token}:intent (JSON) + EXPIRE 24h
   get_language(session_token) → str (default "es")
   set_language(session_token, lang: str) → None

2. permissions.py — AnonRateThrottle:
   Límites: sessions=5/h, messages=10/h, leads=3/h por IP
   Clave Redis: asistente_ia:ratelimit:{ip_hash}:{scope} TTL=3600
   Retornar 429 con Retry-After header si excede límite

El proyecto ya tiene Redis en settings.py. Usar django.core.cache o redis-py directo.
```

---

## ═══ DEV B — OpenRouter Client + Intent Engine + Tests ═══

### Tareas del día
- [ ] `services/openrouter.py`: cliente OpenRouter + `openrouter_embed()`
- [ ] `services/intent_engine.py`: `IntentResult` dataclass + `extract_intent()`
- [ ] `INTENT_SCHEMA` con json_schema strict (7 campos + metadata)
- [ ] System prompt multiidioma (ES/EN/PT)
- [ ] `tests/test_intent_engine.py`: los 20 casos exactos de spec 03

### Prompt Día 2 — Dev B
```
Soy el desarrollador B (Backend IA) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/03_intent_engine.md  ← contrato completo + 20 test cases
  docs/specs/asistente_ia/01_architecture.md §OpenRouter  ← configuración del cliente

Tarea:
1. services/openrouter.py:
   from openai import OpenAI
   client = OpenAI(
     base_url="https://openrouter.ai/api/v1",
     api_key=settings.OPENROUTER_API_KEY,
     default_headers={
       "HTTP-Referer": settings.OPENROUTER_APP_URL,
       "X-Title": settings.OPENROUTER_APP_TITLE
     }
   )
   def openrouter_embed(text: str) -> list[float]:
     → client.embeddings.create(model="openai/text-embedding-3-small", input=text)
     → retorna .data[0].embedding

2. services/intent_engine.py:
   - @dataclass IntentResult con los 11 campos de spec 03
   - INTENT_SCHEMA con json_schema strict
   - def extract_intent(messages: list[dict], language: str = "es") -> IntentResult
     temperature=0.1, max_tokens=500, model="openai/gpt-4o-mini"
   - def detect_language(text: str) → "es"|"en"|"pt" (heurística o LLM ligero)

3. tests/test_intent_engine.py:
   - Los 20 casos exactos de la tabla en spec 03
   - Mockear la llamada a OpenRouter con unittest.mock
   - 100% de los 20 casos deben pasar

Variables de entorno requeridas en backend/.env:
OPENROUTER_API_KEY, OPENROUTER_APP_URL, OPENROUTER_APP_TITLE
```

---

## ═══ DEV C — Hook useChatSession + Componentes base ═══

### Tareas del día
- [ ] `useChatSession.ts`: implementar `initSession()` real (llama al Endpoint 1)
- [ ] `ChatHeader.tsx`: logo + selector de idioma ES|EN
- [ ] `MessageComposer.tsx`: textarea + chips de atajo + botón enviar
- [ ] `UserMessage.tsx` y `AssistantMessage.tsx`: burbujas con tokens de diseño

### Prompt Día 2 — Dev C
```
Soy el desarrollador C (Full Stack) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/06_frontend_spec.md §Hook useChatSession y §Chips de atajo
  docs/specs/asistente_ia/05_api_spec.md §Endpoint 1  ← contrato de respuesta
  CONTEXT.md §8  ← tokens de color (OBLIGATORIO)

Dev B entregó ayer el Endpoint 1. Ya puedo conectar el frontend.

Tarea:
1. hooks/useChatSession.ts — implementar initSession():
   POST /api/asistente-ia/sessions/
   Guardar sessionId y sessionToken en estado
   Llamar initSession() en useEffect al montar ChatDiscovery

2. ChatHeader.tsx:
   bg #1E1B4B (--color-dark-navy), texto blanco
   Logo "🧭 Asistente IA  by ToTem HUB" + botones [ES] [EN]
   Click en idioma → actualizar language en el hook

3. MessageComposer.tsx:
   Textarea max 1000 chars + contador de caracteres
   Chips: ["Aventura", "Familia con niños", "Sin vuelos", "Presupuesto medio"]
   Click chip → append al input. Enter o botón → llama sendMessage()
   Botón deshabilitado si isStreaming=true o input vacío

4. UserMessage.tsx: alineado derecha, bg #5B4FE8, texto blanco, border-radius 12px
   AssistantMessage.tsx: alineado izquierda, bg #FFFFFF, borde #E0E4EF

TypeScript estricto. Lucide React para iconos. Sin 'any'.
```

---
---

# DÍA 3 — RAG Engine + Streaming SSE

## ═══ DEV A — Endpoint SSE completo ═══

### Tareas del día
- [ ] `MessageView` con `StreamingHttpResponse` (content_type text/event-stream)
- [ ] Generador Python que emite eventos SSE tipados
- [ ] Integrar `ConversationManager` + `IntentEngine` + `RAGEngine` en el flujo
- [ ] Manejar todos los casos: clarification, matches, error
- [ ] Aplicar `AnonRateThrottle` en este endpoint

### Prompt Día 3 — Dev A
```
Soy el desarrollador A (Backend — infraestructura) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/05_api_spec.md §Endpoint 2  ← eventos SSE tipados
  docs/specs/asistente_ia/01_architecture.md §Flujo de datos  ← pasos 1-6

Dev B entrega hoy RAGEngine. Coordinar: importar rag_engine.search_matches().

Tarea — MessageView (POST /api/asistente-ia/sessions/{id}/message/):
1. Validar session_token existe y no expiró → 400 si inválido
2. Aplicar AnonRateThrottle scope="messages" → 429 si excede
3. ConversationManager.add_message(token, "user", content)
4. intent = IntentEngine.extract_intent(messages, language)
5a. Si intent.needs_clarification:
    → stream tokens de la clarification_question
    → emitir {"type":"clarification","question":"..."}
5b. Si RAG activado (confidence≥0.70, fields≥3):
    → matches = RAGEngine.search_matches(intent)
    → emitir {"type":"matches","data":[...]} (dataclasses.asdict)
    → stream respuesta LLM con contexto de matches
6. Emitir {"type":"intent","data":{...}} y {"type":"done"}
7. Capturar cualquier Exception → emitir {"type":"error","message":"Error interno"}

Formato SSE: cada evento = "data: {json}\n\n"
Usar StreamingHttpResponse con generator function.
```

---

## ═══ DEV B — RAG Engine + Script Embeddings ═══

### Tareas del día
- [ ] `services/rag_engine.py`: `MatchResult` dataclass + `search_matches()`
- [ ] `build_query_text()` desde `IntentResult`
- [ ] Query pgvector con `cursor()` (SQL de spec 04)
- [ ] Funciones de scoring: `availability_score`, `plan_score`, `final_match_score`
- [ ] `scripts/embed_batch.py` para generar embeddings iniciales
- [ ] `tests/test_rag_engine.py`: 5 búsquedas con intents de prueba

### Prompt Día 3 — Dev B
```
Soy el desarrollador B (Backend IA) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/04_rag_engine.md  ← contrato completo
  docs/specs/asistente_ia/02_database_schema.md §Texto compuesto para embedding

Dev A integra RAGEngine hoy. MatchResult debe ser serializable con dataclasses.asdict().

Tarea:
1. services/rag_engine.py:
   - @dataclass MatchResult con los 11 campos de spec 04
   - build_query_text(intent: IntentResult) → str
   - search_matches(intent, limit=3) → list[MatchResult]:
     * embed = openrouter_embed(build_query_text(intent))
     * Ejecutar SQL de spec 04 con django.db.connection.cursor()
     * Para cada fila calcular final_match_score(semantic, availability, plan)
     * Filtrar resultados con score < 0.50
     * Retornar top {limit} ordenados por match_score DESC

2. apps/asistente_ia/scripts/embed_batch.py:
   Itinerarios con embedding IS NULL → construir texto → openrouter_embed()
   → UPDATE + registro en asistente_ia_embeddings_log. Lotes de 50.
   Repetir para viajes con status='publicado' y cupos > 0.

3. tests/test_rag_engine.py:
   5 casos con IntentResult de prueba, mockear cursor() y openrouter_embed()
   Verificar: match_score en [0,1], solo viajes publicados, top-1 esperado.
```

---

## ═══ DEV C — SSE Client + ChatThread Streaming ═══

### Tareas del día
- [ ] `sendMessage()` en `useChatSession` con fetch + ReadableStream manual
- [ ] Parsear eventos SSE: `token`, `matches`, `clarification`, `done`, `error`
- [ ] `ChatThread.tsx` con auto-scroll y cursor parpadeante durante stream
- [ ] `AIFollowUpCard.tsx` para preguntas de clarificación con botones rápidos
- [ ] `AssistantMessage.tsx` renderiza `AgencyMatchCard` cuando tiene `matches[]`

### Prompt Día 3 — Dev C
```
Soy el desarrollador C (Full Stack) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/06_frontend_spec.md §Flujo SSE en sendMessage
  docs/specs/asistente_ia/05_api_spec.md §Endpoint 2 eventos SSE

Dev A entrega hoy el endpoint SSE. Mientras no esté listo, usar mock local.

Tarea:
1. hooks/useChatSession.ts — sendMessage(content: string):
   * Agregar mensaje user a messages[] con id único
   * Agregar mensaje assistant vacío con isStreaming=true
   * fetch POST /api/asistente-ia/sessions/{sessionId}/message/
   * Leer body como ReadableStream con TextDecoder
   * Parsear líneas "data: {json}" manualmente
   * "token" → append a messages[last].content
   * "matches" → messages[last].matches = data
   * "clarification" → messages[last].clarification = question
   * "done" → messages[last].isStreaming = false, isStreaming global = false
   * "error" → setError(message)

2. ChatThread.tsx:
   * useRef al div final + useEffect que llama scrollIntoView en cada mensaje
   * Si messages[last].isStreaming → mostrar cursor CSS: animate-pulse "▋"
   * Si message.matches?.length > 0 → renderizar <AgencyMatchCard> por cada match

3. AIFollowUpCard.tsx: muestra message.clarification + 3 botones de respuesta rápida
   contextuales (ej. si pregunta duración → "1 semana", "10 días", "2 semanas")
```

---
---

# DÍA 4 — UI Completa + Lead Generation

## ═══ DEV A — Endpoint POST /leads + Email ═══

### Tareas del día
- [ ] `CreateLeadView`: validaciones + crear `AsistenteIaLead` en DB
- [ ] Control de duplicados: `409` si sesión ya tiene lead para esa agencia
- [ ] `services/lead_notifier.py`: email vía Resend con resumen estructurado
- [ ] Template HTML del email con intención + viaje consultado + mensaje viajero

### Prompt Día 4 — Dev A
```
Soy el desarrollador A (Backend — infraestructura) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/05_api_spec.md §Endpoint 3
  docs/specs/asistente_ia/07_leads_backoffice.md §Email de notificación
  apps/notificaciones/  ← referencia de cómo se usa Resend en el proyecto

Dev C conecta este endpoint hoy. Confirmarle el contrato exacto de respuesta.

Tarea:
1. CreateLeadView — POST /api/asistente-ia/leads/:
   Validar: session_token activo, company_id existe, trip_id existe y publicado,
   traveler_email formato válido, traveler_name min 2 chars.
   Duplicado: if AsistenteIaLead.objects.filter(session=session, company_id=company_id).exists()
              → return 409 {"detail": "Ya enviaste una consulta a esta agencia"}
   Crear lead → llamar LeadNotifier.send(lead) → retornar {lead_id, message, created_at}

2. services/lead_notifier.py — send(lead):
   Obtener email del admin de lead.company_id
   Resend email con:
     Asunto: f"Nuevo lead de Asistente IA — {lead.traveler_name}"
     Body HTML: datos viajero, intent_data formateado, nombre del viaje,
               match_score%, mensaje del viajero, botón "Ver en backoffice"
   Envío síncrono (no async en MVP)
```

---

## ═══ DEV B — LLM Contextualizado + Ajuste Tests ═══

### Tareas del día
- [ ] `generate_response_stream()`: LLM con contexto RAG inyectado en system prompt
- [ ] Manejo cuando RAG retorna vacío (sin matches disponibles)
- [ ] Detección y persistencia de idioma en Redis por sesión
- [ ] Todos los 20 tests del Intent Engine en verde (100% pass)

### Prompt Día 4 — Dev B
```
Soy el desarrollador B (Backend IA) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/03_intent_engine.md §System prompt
  docs/specs/asistente_ia/01_architecture.md §Flujo de datos paso 4b

Tarea:
1. En services/intent_engine.py, crear generate_response_stream(messages, intent, matches, language):
   System prompt:
     "Eres Asistente IA de ToTem HUB. Responde en {language}.
      CONTEXTO DE ITINERARIOS DISPONIBLES: {json de matches}
      Usa solo datos del contexto. No inventes precios ni fechas.
      Si el viajero pregunta algo que no está en el contexto, di que no tienes esa info."
   Si matches vacío: system prompt alternativo para hacer preguntas de exploración
   Llamar client.chat.completions.create(stream=True, model=CHAT_MODEL)
   yield chunk.choices[0].delta.content para cada chunk no nulo

2. detect_language ya implementada → llamar al inicio de cada mensaje
   y persistir con ConversationManager.set_language()

3. Ejecutar los 20 tests: python manage.py test apps.asistente_ia.tests.test_intent_engine
   Corregir system prompt o lógica hasta 100% pass. No modificar los tests.
```

---

## ═══ DEV C — AgencyMatchCard + LeadForm completos ═══

### Tareas del día
- [ ] `AgencyMatchCard.tsx` completo con datos reales de `MatchResult`
- [ ] `LeadForm.tsx` como drawer lateral con validación client-side
- [ ] `submitLead()` en `useChatSession` conectado al Endpoint 3
- [ ] Estado de éxito tras enviar el lead (banner de confirmación)
- [ ] Modal "Ver itinerario" con highlights del match

### Prompt Día 4 — Dev C
```
Soy el desarrollador C (Full Stack) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/06_frontend_spec.md §AgencyMatchCard y §LeadForm
  docs/specs/asistente_ia/05_api_spec.md §Endpoint 3

Dev A entrega hoy el endpoint POST /leads/. Confirmarle el contrato.

Tarea:
1. AgencyMatchCard.tsx — layout exacto de spec 06:
   match_score como %: ≥90% bg #E3F9EC texto #1A8A4A | 70-89% bg #FFF3E0 texto #F59E0B
   Botón "Contactar →" → abre <LeadForm> como drawer
   Botón "Ver itinerario" → modal con match.highlights[] en lista

2. LeadForm.tsx — drawer lateral (right, 400px / full en móvil):
   Campos: traveler_name (requerido), traveler_email (validar), traveler_msg (opcional)
   Submit deshabilitado si campos inválidos o isSubmitting=true
   POST /api/asistente-ia/leads/ con {session_token, company_id: match.trip_id... }
   Éxito: cerrar drawer + banner "Tu consulta fue enviada. La agencia responderá en < 4h"
   409: mostrar "Ya enviaste una consulta a esta agencia"

3. hooks/useChatSession.ts — submitLead(data: LeadFormData, match: MatchResult):
   POST al endpoint, manejar 201/409/400

Responsive: drawer a pantalla completa en móvil (<768px).
```

---
---

# DÍA 5 — Backoffice + QA + Deploy

## ═══ DEV A — Rate Limiting QA + Deploy Staging ═══

### Tareas del día
- [ ] Test automatizado de rate limiting (verificar 429 en request 11)
- [ ] Variables de entorno OpenRouter configuradas en Railway/staging
- [ ] Ejecutar `embed_batch.py` en staging con datos de prueba
- [ ] Smoke test manual del flujo completo en staging
- [ ] Verificar logs de errores y tiempos de respuesta (< 3s primer token)

### Prompt Día 5 — Dev A
```
Soy el desarrollador A (Backend — infraestructura) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/README.md §Criterios de aceptación globales

Tarea:
1. Test rate limiting en tests/test_api.py:
   Mockear Redis, llamar endpoint de messages 11 veces con mismo IP
   Verificar que respuesta 11 es HTTP 429 con Retry-After header

2. railway.toml o .env staging — agregar:
   OPENROUTER_API_KEY, OPENROUTER_APP_URL, OPENROUTER_APP_TITLE

3. En staging: python manage.py shell < apps/asistente_ia/scripts/embed_batch.py
   Verificar: SELECT count(*) FROM itinerarios WHERE embedding IS NOT NULL;

4. Smoke test manual (curl o Postman):
   a. POST /api/asistente-ia/sessions/ → obtener session_token
   b. POST /sessions/{id}/message/ → verificar SSE con tokens en < 3s
   c. POST /api/asistente-ia/leads/ → verificar 201 y email recibido
   Reportar tiempos de respuesta al equipo.
```

---

## ═══ DEV B — Endpoints Backoffice + Tests de integración ═══

### Tareas del día
- [ ] `AgencyLeadsListView`: GET paginado, filtro por status, multi-tenant
- [ ] `AgencyLeadDetailView`: GET detalle del lead
- [ ] `LeadStatusUpdateView`: PATCH status con validación de ownership
- [ ] `tests/test_api.py`: flujo completo de integración (session → message → lead → backoffice)

### Prompt Día 5 — Dev B
```
Soy el desarrollador B (Backend IA) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/07_leads_backoffice.md §Endpoints del backoffice
  AGENTS.md §Permisos RBAC (IsAdmin de core/permissions.py)
  CONTEXT.md §4 (roles: admin solo ve su company)

Dev C consume estos endpoints hoy. Entregarle el contrato de respuesta.

Tarea:
1. AgencyLeadsListView — GET /api/asistente-ia/agency/leads/:
   Requiere JWT + rol admin. Filtrar: company_id = perfil del admin autenticado.
   ?status=new|contacted|converted|all. Paginar con core/pagination.py (25/página).
   Serializer: id, traveler_name, intent_data.destination, match_score, status, created_at

2. AgencyLeadDetailView — GET /api/asistente-ia/agency/leads/{id}/:
   Todos los campos del lead. Solo si lead.company_id == admin.company_id.

3. LeadStatusUpdateView — PATCH /api/asistente-ia/agency/leads/{id}/status/:
   Body: {"status": "contacted"}. Validar enum. Ownership check.

4. tests/test_api.py — test de integración completo:
   POST /sessions/ → POST /message/ (mock LLM) → POST /leads/
   → GET /agency/leads/ → PATCH status → verificar estado final
```

---

## ═══ DEV C — Panel Backoffice Frontend + E2E ═══

### Tareas del día
- [ ] `app/(backoffice)/asistente-ia/leads/page.tsx` con tabla de leads
- [ ] `LeadsTable.tsx`: columnas, filtros por estado, click para detalle
- [ ] `LeadDetailModal.tsx`: vista completa + botón "Marcar contactado"
- [ ] Badge en sidebar con polling cada 60s
- [ ] Verificar flujo completo en staging

### Prompt Día 5 — Dev C
```
Soy el desarrollador C (Full Stack) del equipo ToTem HUB, módulo Asistente IA.

Lee antes de empezar:
  docs/specs/asistente_ia/07_leads_backoffice.md  ← completo
  AGENTS.md §Frontend (patrón de tablas: app/viajes/page.tsx como referencia)
  CONTEXT.md §8 (tokens de color para estados: verde=nuevo, amarillo=contactado)

Dev B entrega hoy los endpoints de backoffice.

Tarea:
1. app/(backoffice)/asistente-ia/leads/page.tsx:
   Fetch GET /api/asistente-ia/agency/leads/?status={filter}
   Renderiza <LeadsTable>. Protegida por middleware (rol admin).

2. components/asistente-ia/LeadsTable.tsx:
   Columnas: Viajero | Destino (intent_data.destination) | Match% | Estado | Recibido
   Filtros como tabs: Todos | Nuevo | Contactado | Convertido
   Click fila → abre <LeadDetailModal>
   Badge de estado: Nuevo=#E3F9EC/#1A8A4A | Contactado=#FFF3E0/#F59E0B

3. components/asistente-ia/LeadDetailModal.tsx:
   Mostrar intent_data con etiquetas claras, nombre del viaje, match_score%
   Mostrar traveler_msg si existe
   "Marcar como contactado" → PATCH /agency/leads/{id}/status/ {status:"contacted"}
   "Responder al viajero" → window.location = mailto:{email}

4. Badge en sidebar:
   useSWR("/api/asistente-ia/agency/leads/?status=new&page_size=1", {refreshInterval:60000})
   Mostrar número si count > 0. Mismo componente de sidebar que ya existe.
```

---
---

## Dependencias entre devs

```
DÍA 1:  A ──── BD schema
        B ──── Modelos + Endpoint sesión        ← C consume Endpoint 1
        C ──── Setup Frontend

DÍA 2:  A ──── Redis + Rate limit
        B ──── OpenRouter + Intent Engine       ← C conecta Endpoint 1 real
        C ──── UI base + initSession()

DÍA 3:  B ──── RAGEngine ──────────────────────► A integra en SSE endpoint
        A ──── SSE Endpoint completo            ← C lo consume con mock primero
        C ──── Streaming SSE client

DÍA 4:  A ──── POST /leads/ ───────────────────► C conecta LeadForm
        B ──── LLM contextualizado + tests
        C ──── AgencyMatchCard + LeadForm

DÍA 5:  B ──── Endpoints backoffice ───────────► C los consume
        A ──── Deploy + QA infra
        C ──── Panel backoffice + E2E
```

## Sincronizaciones obligatorias

| Cuándo | Quién | Para qué |
|--------|-------|---------|
| Fin Día 1 | A + B | Confirmar que schema SQL y modelos Django coinciden en campo a campo |
| Inicio Día 3 | B → A | B entrega `MatchResult` con `dataclasses.asdict()` funcionando |
| Inicio Día 4 | A → C | A confirma contrato exacto del Endpoint 3 (campos requeridos) |
| Fin Día 4 | A + B + C | Smoke test local del flujo completo: chat → matches → lead → email |
| Fin Día 5 | A + B + C | Go/No-Go staging antes de presentar a agencias piloto |
