# AGENTS.md

## Arquitectura activa

Totem HUB se organiza como microservicios DDD hexagonales.

Codigo activo:

- `apps/web`
- `apps/api-gateway`
- `services/*`
- `packages/*`
- `infra/*`

Fuente legacy:

- `ANtigua estructura completa/`

## Prohibiciones

- No crear `backend/apps`.
- No crear `backend/src/totem_hub` como monolito activo.
- No crear `frontend/components`, `frontend/lib` o `frontend/types` como capas globales activas.
- No copiar carpetas legacy completas como estructura activa.
- No usar git en esta migracion.
