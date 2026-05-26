# Asistente IA — Índice de Specs SSD

> Módulo `apps/asistente_ia` dentro del monorepo totem-mvp1.
> Metodología: Spec-Driven Development — implementar solo lo que está en spec.
> PM: Juan Ayquipa Abarca | Versión: 1.0 | Mayo 2026

---

## Pregunta de negocio que valida el MVP

> ¿Puede el Asistente IA convertir una conversación libre en un lead calificado para una agencia de ToTem HUB dentro de una misma sesión?

---

## Decisiones de arquitectura

| Decisión | Elección | Razón |
|----------|----------|-------|
| Ubicación | `apps/asistente_ia/` en monorepo | Acceso directo a modelos existentes, sin HTTP |
| Proveedor LLM | OpenRouter API | Flexibilidad de modelos, costo controlable, escalable |
| Modelo Intent Engine | `openai/gpt-4o-mini` vía OpenRouter | Structured outputs, ~$0.001/sesión |
| Embeddings | `openai/text-embedding-3-small` vía OpenRouter | Sin infra externa nueva |
| Vector search | `pgvector` en Supabase (ya existe) | Sin nueva BD |
| Sesiones | Redis (ya en stack) | TTL 24h, sesión anónima |
| Streaming | Server-Sent Events (SSE) | Nativo Django/DRF, sin WebSocket |
| Notificaciones | Resend (ya integrado) | Email inmediato a agencia |

---

## Archivos de spec (leer en orden)

| # | Archivo | Contenido |
|---|---------|-----------|
| 00 | [00_PRD.md](00_PRD.md) | Producto, funcionalidades F1-F5, journeys |
| 01 | [01_architecture.md](01_architecture.md) | Stack, módulos internos, flujo de datos |
| 02 | [02_database_schema.md](02_database_schema.md) | 3 tablas nuevas + 2 columnas ALTER |
| 03 | [03_intent_engine.md](03_intent_engine.md) | Intent Engine con OpenRouter structured outputs |
| 04 | [04_rag_engine.md](04_rag_engine.md) | RAG Engine con pgvector |
| 05 | [05_api_spec.md](05_api_spec.md) | 3 endpoints + contratos request/response |
| 06 | [06_frontend_spec.md](06_frontend_spec.md) | Chat Discovery UI (Next.js) |
| 07 | [07_leads_backoffice.md](07_leads_backoffice.md) | Panel de leads para agencia |

---

## Fases de implementación (5 días)

```
FASE 1 — Base IA (Día 1)
  ├── pgvector habilitado + columnas embedding en itineraries/trips
  ├── Crear tablas asistente_ia_sessions + asistente_ia_leads
  ├── POST /api/asistente-ia/sessions (sesión anónima)
  └── Script batch: generar embeddings de itinerarios publicados

FASE 2 — Intent Engine (Día 2)
  ├── OpenRouter client (openrouter.py)
  ├── Intent Engine con structured outputs (7 campos)
  ├── Conversation Manager en Redis (multi-turno, idioma)
  └── Tests unitarios: 20 casos de prueba

FASE 3 — RAG Engine + Streaming (Día 3)
  ├── RAG Engine: embedding de intent + vector search
  ├── Ranking: match_score (semántica + disponibilidad + plan)
  └── POST /api/asistente-ia/sessions/:id/message con SSE

FASE 4 — UI + Lead Generation (Día 4)
  ├── Chat Discovery pantalla (Next.js)
  ├── AgencyMatchCard component
  ├── Micro-formulario de lead (nombre + email + mensaje)
  └── Email de notificación a agencia (Resend)

FASE 5 — Backoffice + QA + Deploy (Día 5)
  ├── Panel /asistente-ia/leads en backoffice agencia
  ├── Badge de notificación en sidebar
  ├── E2E: flujo completo viajero → lead → agencia
  ├── Rate limiting: 10 mensajes/hora por IP
  └── Deploy staging + smoke test con agencias piloto
```

---

## Criterios de aceptación globales

- [ ] Sesión anónima sin registro funciona end-to-end
- [ ] Streaming SSE visible en < 3 segundos primer token
- [ ] Intent Engine extrae ≥ 3 campos con confidence ≥ 0.70
- [ ] RAG retorna máx. 3 opciones rankeadas por match_score
- [ ] Lead llega al panel de agencia + email en < 30 segundos
- [ ] Rate limiting activo: 10 mensajes/hora por IP anónima
- [ ] Tests unitarios Intent Engine: 20 casos, 100% pass
- [ ] E2E flujo completo sin errores en staging
