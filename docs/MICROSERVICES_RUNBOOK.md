# Runbook Microservicios

## Instalar

```bash
corepack enable
corepack prepare pnpm@11.3.0 --activate
pnpm install
```

Requisitos de toolchain:

- Node.js `>=24.0.0`
- pnpm `>=11.3.0`
- TypeScript `^6.0.3`
- Prisma `^7.8.0`
- Next.js `^16.2.6`

## Verificar arquitectura

```bash
python3 tools/verify_architecture.py
python3 tools/verify_migration_coverage.py
```

La verificacion exige:

- `apps/web`, `apps/api-gateway`, `packages/shared-kernel`, `packages/service-runtime`.
- 14 microservicios con capas `domain`, `application`, `ports`, `adapters/http`, `adapters/prisma`.
- Rutas CRUD de capacidad y rutas de negocio por bounded context.
- Prohibicion de `as any`, `as never`, `@ts-ignore` y `eslint-disable` en codigo activo de servicios.

## Ejecutar un servicio

```bash
cd services/trips
pnpm dev
```

## Ejecutar API Gateway

```bash
cd apps/api-gateway
pnpm dev
```

## Generar Prisma Client en todos los servicios

```bash
pnpm prisma:generate
```

## Ejecutar con Docker Compose

Variables requeridas:

```bash
POSTGRES_DB=totem
POSTGRES_USER=totem
POSTGRES_PASSWORD=change-me
```

Comando:

```bash
docker compose up --build
```

## Dockerfile unico de servicios

Todos los microservicios usan:

```text
infra/docker/service.Dockerfile
```

No existen Dockerfiles duplicados por servicio para evitar divergencia operativa.

## Regla de persistencia

Cada microservicio usa su propio schema PostgreSQL mediante Prisma:

```text
postgresql://user:password@postgres:5432/totem?schema=trips
```

Esto evita compartir modelos de persistencia entre bounded contexts.
