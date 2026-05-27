from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN_PATHS = [
    "backend/apps",
    "backend/src/totem_hub",
    "frontend/components",
    "frontend/lib",
    "frontend/types",
]

REQUIRED_PATHS = [
    "apps/web",
    "apps/api-gateway",
    "packages/shared-kernel",
    "packages/service-runtime",
    "services/identity",
    "services/tenancy",
    "services/catalog",
    "services/itineraries",
    "services/trips",
    "services/enrollments",
    "services/payments",
    "services/subscriptions",
    "services/documents",
    "services/rooming",
    "services/notifications",
    "services/assistant",
    "services/support",
    "services/platform",
    "services/audit",
]

SERVICE_REQUIRED_SUBPATHS = [
    "src/domain/entities.ts",
    "src/domain/events.ts",
    "src/domain/errors.ts",
    "src/application/commands.ts",
    "src/application/queries.ts",
    "src/application/use-cases.ts",
    "src/ports/repositories.ts",
    "src/adapters/http/routes.ts",
    "src/adapters/http/business-routes.ts",
    "src/adapters/prisma/repository.ts",
    "src/main.ts",
    "prisma/schema.prisma",
]

FORBIDDEN_CODE_PATTERNS = [
    " as any",
    " as never",
    "@ts-ignore",
    "eslint-disable",
]


def iter_code_files(path: Path):
    for candidate in path.rglob("*"):
        relative_parts = candidate.relative_to(ROOT).parts
        if "node_modules" in relative_parts or "generated" in relative_parts or "dist" in relative_parts or ".next" in relative_parts:
            continue
        if candidate.is_file() and candidate.suffix in {".ts", ".tsx", ".mjs"}:
            yield candidate


def fail(message: str) -> None:
    raise SystemExit(f"[architecture] {message}")


def main() -> None:
    for relative in FORBIDDEN_PATHS:
        if (ROOT / relative).exists():
            fail(f"forbidden path exists: {relative}")

    for relative in REQUIRED_PATHS:
        if not (ROOT / relative).exists():
            fail(f"required path missing: {relative}")

    for service_dir in sorted((ROOT / "services").iterdir()):
        if not service_dir.is_dir():
            continue
        for subpath in SERVICE_REQUIRED_SUBPATHS:
            required = service_dir / subpath
            if not required.exists():
                fail(f"{service_dir.name} missing {subpath}")

    code_roots = [ROOT / "services", ROOT / "apps", ROOT / "packages"]
    for code_root in code_roots:
        for file_path in iter_code_files(code_root):
            text = file_path.read_text(encoding="utf-8")
            normalized = file_path.as_posix()
            for pattern in FORBIDDEN_CODE_PATTERNS:
                if pattern in text:
                    fail(f"forbidden code pattern {pattern!r}: {file_path.relative_to(ROOT)}")
            if "/domain/" in normalized and ("@prisma/client" in text or "node:http" in text):
                fail(f"domain imports infrastructure: {file_path.relative_to(ROOT)}")
            if "/application/" in normalized and "@prisma/client" in text:
                fail(f"application imports prisma: {file_path.relative_to(ROOT)}")
            if "/ui/" in normalized and "fetch(" in text:
                fail(f"ui performs direct fetch: {file_path.relative_to(ROOT)}")

    print("[architecture] ok: ddd hexagonal microservices")


if __name__ == "__main__":
    main()
