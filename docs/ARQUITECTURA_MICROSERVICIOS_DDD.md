# Arquitectura Microservicios DDD Hexagonal

## Estado Activo

El codigo activo vive en:

- `apps/web`
- `services/*`
- `packages/*`
- `infra/*`

La carpeta `ANtigua estructura completa/` es fuente legacy de comportamiento. No es codigo activo.

## Estructura

```text
apps/
  api-gateway/
  web/
services/
  identity/
  tenancy/
  catalog/
  itineraries/
  trips/
  enrollments/
  payments/
  subscriptions/
  documents/
  notifications/
  assistant/
  support/
  platform/
  audit/
packages/
  shared-kernel/
  service-runtime/
infra/
  docker/
  postgres/
```

## Capas por Servicio

Cada microservicio implementa:

- `domain`: entidades, errores y eventos.
- `application`: comandos, queries y casos de uso.
- `ports`: contratos de repositorio/gateway.
- `adapters/http`: entrada HTTP.
- `adapters/prisma`: persistencia PostgreSQL via Prisma.
- `prisma`: schema del servicio.

## Regla

La migracion no copia carpetas antiguas. Reimplementa capacidades del codigo legacy dentro del bounded context correcto.
