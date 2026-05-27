# Remodernizacion Totem HUB

## Mandato

La arquitectura activa es DDD, hexagonal y de microservicios.

## Codigo activo

- `apps/web`: Next.js como frontend.
- `apps/api-gateway`: frontera HTTP de entrada hacia microservicios.
- `services/*`: microservicios por bounded context.
- `packages/shared-kernel`: value objects y contratos compartidos.
- `packages/service-runtime`: runtime HTTP comun.
- `infra`: despliegue, PostgreSQL y configuracion.

## Bounded Contexts

- identity
- tenancy
- catalog
- itineraries
- trips
- enrollments
- payments
- subscriptions
- documents
- notifications
- assistant
- support
- platform
- audit

## Regla de migracion

La logica antigua se lee, se entiende y se reimplementa en el bounded context correspondiente. No se trasladan carpetas legacy como arquitectura activa.
