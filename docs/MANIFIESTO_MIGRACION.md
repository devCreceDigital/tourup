# Manifiesto de Migracion Microservicios

## Fuente Legacy

`ANtigua estructura completa/` se usa solo para entender comportamiento existente.

## Codigo Nuevo Activo

- `apps/web`
- `services/*`
- `packages/*`
- `infra/*`

## Politica

No se permite usar la estructura anterior como destino. Cada comportamiento legacy debe pasar por esta clasificacion:

- regla de negocio -> `services/{context}/src/domain`
- flujo de aplicacion -> `services/{context}/src/application`
- contrato requerido -> `services/{context}/src/ports`
- persistencia -> `services/{context}/src/adapters/prisma`
- HTTP -> `services/{context}/src/adapters/http`
- UI -> `apps/web/src/contexts/{context}`

## Corte

Una capacidad se considera migrada cuando existe en un servicio con domain, application, ports, adapters, Prisma schema y ruta HTTP.

