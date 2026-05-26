# Trazabilidad de Migracion Legacy a DDD

Estado verificado con:

```bash
python3 tools/verify_architecture.py
python3 tools/verify_migration_coverage.py
```

## Backend legacy a microservicios

| Legacy | Contexto activo |
|---|---|
| `backend/apps/asistente_ia` | `services/assistant` |
| `backend/apps/audit` | `services/audit` |
| `backend/apps/catalogo` | `services/catalog` |
| `backend/apps/dashboard_admin` | `services/platform` |
| `backend/apps/documentos` | `services/documents` |
| `backend/apps/inscripciones` | `services/enrollments` |
| `backend/apps/itinerarios` | `services/itineraries` |
| `backend/apps/notificaciones` | `services/notifications` |
| `backend/apps/pagos` | `services/payments` |
| `backend/apps/planes` | `services/subscriptions` |
| `backend/apps/soporte` | `services/support` |
| `backend/apps/superadmin` | `services/platform` |
| `backend/apps/tenancy` | `services/tenancy` |
| `backend/apps/usuarios` | `services/identity` |
| `backend/apps/viajes` | `services/trips` |

## Spec legacy a bounded context

| Spec legacy | Contexto activo |
|---|---|
| `docs/specs/asistente_ia` | `services/assistant` |
| `docs/specs/catalogo.md` | `services/catalog` |
| `docs/specs/documentos.md` | `services/documents` |
| `docs/specs/inscripciones.md` | `services/enrollments` |
| `docs/specs/notificaciones.md` | `services/notifications` |
| `docs/specs/pagos.md` | `services/payments` |
| `docs/specs/rooming.md` | `services/rooming` |
| `docs/specs/viajes.md` | `services/trips` |

## Frontend legacy a rutas activas

| Legacy | Ruta activa |
|---|---|
| `frontend/app/(auth)/login/page.tsx` | `apps/web/src/app/login/page.tsx` |
| `frontend/app/(dashboard)/admin/page.tsx` | `apps/web/src/app/admin/page.tsx` |
| `frontend/app/(public)/contacto/page.tsx` | `apps/web/src/app/contacto/page.tsx` |
| `frontend/app/(public)/destinos/page.tsx` | `apps/web/src/app/destinos/page.tsx` |
| `frontend/app/(public)/galeria/page.tsx` | `apps/web/src/app/galeria/page.tsx` |
| `frontend/app/(public)/nosotros/page.tsx` | `apps/web/src/app/nosotros/page.tsx` |
| `frontend/app/(public)/onboarding/page.tsx` | `apps/web/src/app/onboarding/page.tsx` |
| `frontend/app/(public)/page.tsx` | `apps/web/src/app/page.tsx` |
| `frontend/app/(public)/pricing/page.tsx` | `apps/web/src/app/pricing/page.tsx` |
| `frontend/app/(public)/registro/page.tsx` | `apps/web/src/app/registro/page.tsx` |
| `frontend/app/(public)/reservar/page.tsx` | `apps/web/src/app/reservar/page.tsx` |
| `frontend/app/(public)/viajes/page.tsx` | `apps/web/src/app/viajes/page.tsx` |
| `frontend/app/(superadmin)/superadmin/page.tsx` | `apps/web/src/app/superadmin/page.tsx` |
| `frontend/app/(viajero)/viajero/page.tsx` | `apps/web/src/app/viajero/page.tsx` |
| `frontend/app/asistente-ia/page.tsx` | `apps/web/src/app/asistente-ia/page.tsx` |
| `frontend/app/explorar/page.tsx` | `apps/web/src/app/explorar/page.tsx` |
| `frontend/app/stats/page.tsx` | `apps/web/src/app/stats/page.tsx` |
| `frontend/app/trip/[token]/page.tsx` | `apps/web/src/app/trip/[token]/page.tsx` |
| `frontend/app/trip/page.tsx` | `apps/web/src/app/trip/page.tsx` |

## Fundacion

| Legacy | Activo |
|---|---|
| `contracts/openapi.yaml` | `contracts/openapi.yaml` |
| `scripts/01_initial_schema.sql` | `infra/postgres/init/001-create-service-schemas.sql` |
| `scripts/03_tenants_schema.sql` | `infra/postgres/init/001-create-service-schemas.sql` |
| `scripts/04_rls_policies.sql` | `infra/postgres/init/002-rls-foundation.sql` |
| `docker-compose.yml` | `docker-compose.yml` |
