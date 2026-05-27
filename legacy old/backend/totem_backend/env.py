"""Utilidades de configuracion de entorno para Totem HUB."""

from __future__ import annotations

import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv


VALID_ENVIRONMENTS = {"local", "staging", "production", "test"}


def load_environment_files(base_dir: Path) -> None:
    """Carga variables desde raiz del repo y backend/.env.

    Prioridad:
    1. Variables ya exportadas en el sistema o inyectadas por Docker.
    2. `backend/.env`
    3. `.env` en la raiz del repo
    """

    root_env = base_dir.parent / ".env"
    backend_env = base_dir / ".env"

    load_dotenv(root_env, override=False)
    load_dotenv(backend_env, override=False)


def get_runtime_environment() -> str:
    environment = os.getenv("APP_ENV", "local").strip().lower()
    if environment not in VALID_ENVIRONMENTS:
        raise ImproperlyConfigured(
            "APP_ENV debe ser uno de: local, staging, production, test."
        )
    return environment


def is_production_like(environment: str) -> bool:
    return environment in {"staging", "production"}


def get_env(
    name: str,
    default: str | None = None,
    *,
    required: bool = False,
    allow_blank: bool = False,
) -> str | None:
    value = os.getenv(name, default)

    if value is None:
        if required:
            raise ImproperlyConfigured(f"La variable {name} es obligatoria.")
        return None

    value = value.strip()
    if not value and not allow_blank:
        if required:
            raise ImproperlyConfigured(f"La variable {name} no puede estar vacia.")
        return default

    return value


def get_bool_env(name: str, default: bool = False) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    normalized = raw_value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False

    raise ImproperlyConfigured(
        f"La variable {name} debe ser booleana (true/false, 1/0, yes/no)."
    )


def get_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return int(raw_value)
    except ValueError as exc:
        raise ImproperlyConfigured(f"La variable {name} debe ser un entero.") from exc


def get_list_env(name: str, default: list[str] | None = None) -> list[str]:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default or []

    return [item.strip() for item in raw_value.split(",") if item.strip()]


def validate_environment(*, environment: str, debug: bool, secret_key: str) -> None:
    if is_production_like(environment) and debug:
        raise ImproperlyConfigured("DEBUG debe ser False en staging y production.")

    insecure_secret_keys = {"dev-secret-key", "dev-only-change-me", "change-me-in-local"}
    if is_production_like(environment) and secret_key in insecure_secret_keys:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY debe ser un valor real en staging y production."
        )

    if is_production_like(environment):
        required_variables = (
            "DATABASE_URL",
            "APP_JWT_SECRET",
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY",
            "SUPABASE_JWT_SECRET",
        )
        for variable_name in required_variables:
            get_env(variable_name, required=True)
