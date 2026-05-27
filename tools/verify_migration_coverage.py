from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LEGACY = ROOT / "ANtigua estructura completa"

BACKEND_CONTEXTS = {
    "asistente_ia": "services/assistant",
    "audit": "services/audit",
    "catalogo": "services/catalog",
    "dashboard_admin": "services/platform",
    "documentos": "services/documents",
    "inscripciones": "services/enrollments",
    "itinerarios": "services/itineraries",
    "notificaciones": "services/notifications",
    "pagos": "services/payments",
    "planes": "services/subscriptions",
    "soporte": "services/support",
    "superadmin": "services/platform",
    "tenancy": "services/tenancy",
    "usuarios": "services/identity",
    "viajes": "services/trips",
}

FRONTEND_ROUTES = {
    "frontend/app/(auth)/login/page.tsx": "apps/web/src/app/login/page.tsx",
    "frontend/app/(dashboard)/admin/page.tsx": "apps/web/src/app/admin/page.tsx",
    "frontend/app/(public)/contacto/page.tsx": "apps/web/src/app/contacto/page.tsx",
    "frontend/app/(public)/destinos/page.tsx": "apps/web/src/app/destinos/page.tsx",
    "frontend/app/(public)/galeria/page.tsx": "apps/web/src/app/galeria/page.tsx",
    "frontend/app/(public)/nosotros/page.tsx": "apps/web/src/app/nosotros/page.tsx",
    "frontend/app/(public)/onboarding/page.tsx": "apps/web/src/app/onboarding/page.tsx",
    "frontend/app/(public)/page.tsx": "apps/web/src/app/page.tsx",
    "frontend/app/(public)/pricing/page.tsx": "apps/web/src/app/pricing/page.tsx",
    "frontend/app/(public)/registro/page.tsx": "apps/web/src/app/registro/page.tsx",
    "frontend/app/(public)/reservar/page.tsx": "apps/web/src/app/reservar/page.tsx",
    "frontend/app/(public)/viajes/page.tsx": "apps/web/src/app/viajes/page.tsx",
    "frontend/app/(superadmin)/superadmin/page.tsx": "apps/web/src/app/superadmin/page.tsx",
    "frontend/app/(viajero)/viajero/page.tsx": "apps/web/src/app/viajero/page.tsx",
    "frontend/app/asistente-ia/page.tsx": "apps/web/src/app/asistente-ia/page.tsx",
    "frontend/app/explorar/page.tsx": "apps/web/src/app/explorar/page.tsx",
    "frontend/app/stats/page.tsx": "apps/web/src/app/stats/page.tsx",
    "frontend/app/trip/[token]/page.tsx": "apps/web/src/app/trip/[token]/page.tsx",
    "frontend/app/trip/page.tsx": "apps/web/src/app/trip/page.tsx",
}

FRONTEND_COMPONENT_GROUPS = {
    "frontend/components/admin": "apps/web/src/contexts/platform/ui",
    "frontend/components/admin/inscripciones": "apps/web/src/contexts/enrollments/ui",
    "frontend/components/admin/itinerarios": "apps/web/src/contexts/itineraries",
    "frontend/components/asistente-ia": "apps/web/src/contexts/assistant/ui",
    "frontend/components/dashboard": "apps/web/src/contexts/platform/ui",
    "frontend/components/layout": "apps/web/src/shared/ui",
    "frontend/components/public": "apps/web/src/contexts/trips/ui",
    "frontend/components/shared": "apps/web/src/shared/ui",
    "frontend/components/ui": "apps/web/src/shared/ui",
    "frontend/hooks": "apps/web/src/contexts/assistant",
    "frontend/lib": "apps/web/src/shared",
    "frontend/types": "packages/shared-kernel/src",
}

SPEC_CONTEXTS = {
    "docs/specs/asistente_ia": "services/assistant",
    "docs/specs/catalogo.md": "services/catalog",
    "docs/specs/documentos.md": "services/documents",
    "docs/specs/inscripciones.md": "services/enrollments",
    "docs/specs/notificaciones.md": "services/notifications",
    "docs/specs/pagos.md": "services/payments",
    "docs/specs/rooming.md": "services/rooming",
    "docs/specs/viajes.md": "services/trips",
}

FOUNDATION_FILES = {
    "contracts/openapi.yaml": "contracts/openapi.yaml",
    "scripts/01_initial_schema.sql": "infra/postgres/init/001-create-service-schemas.sql",
    "scripts/03_tenants_schema.sql": "infra/postgres/init/001-create-service-schemas.sql",
    "scripts/04_rls_policies.sql": "infra/postgres/init/002-rls-foundation.sql",
    "docker-compose.yml": "docker-compose.yml",
}


def fail(message: str) -> None:
    raise SystemExit(f"[migration] {message}")


def assert_exists(relative: str) -> None:
    if not (ROOT / relative).exists():
        fail(f"active target missing: {relative}")


def main() -> None:
    if not LEGACY.exists():
        fail("legacy source directory missing")

    for app_name, target in BACKEND_CONTEXTS.items():
        if not (LEGACY / "backend" / "apps" / app_name).exists():
            fail(f"legacy backend app missing from source inventory: {app_name}")
        assert_exists(target)
        assert_exists(f"{target}/src/adapters/http/business-routes.ts")
        assert_exists(f"{target}/src/adapters/prisma/repository.ts")

    for legacy_route, active_route in FRONTEND_ROUTES.items():
        if not (LEGACY / legacy_route).exists():
            fail(f"legacy frontend route missing from source inventory: {legacy_route}")
        assert_exists(active_route)

    for legacy_group, active_group in FRONTEND_COMPONENT_GROUPS.items():
        if not (LEGACY / legacy_group).exists():
            fail(f"legacy frontend group missing from source inventory: {legacy_group}")
        assert_exists(active_group)

    for legacy_spec, active_context in SPEC_CONTEXTS.items():
        if not (LEGACY / legacy_spec).exists():
            fail(f"legacy spec missing from source inventory: {legacy_spec}")
        assert_exists(active_context)

    for legacy_file, active_file in FOUNDATION_FILES.items():
        if not (LEGACY / legacy_file).exists():
            fail(f"legacy foundation file missing from source inventory: {legacy_file}")
        assert_exists(active_file)

    print("[migration] ok: legacy inventory has active DDD targets")


if __name__ == "__main__":
    main()
