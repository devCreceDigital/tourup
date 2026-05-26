from django.conf import settings
from django.db import connection


RLS_CONTEXT_KEYS = (
    "app.current_tenant",
    "app.current_user_id",
    "app.current_role",
)


def _is_supported_connection() -> bool:
    return bool(getattr(settings, "DB_RLS_CONTEXT_ENABLED", True) and connection.vendor == "postgresql")


def _set_runtime_config(key: str, value: str) -> None:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config(%s, %s, false)", [key, value])
    except Exception:
        try:
            connection.close()
        except Exception:
            pass


def reset_db_context() -> None:
    if not _is_supported_connection():
        return
    try:
        for key in RLS_CONTEXT_KEYS:
            _set_runtime_config(key, "")
    except Exception:
        try:
            connection.close()
        except Exception:
            pass


def apply_db_context(*, tenant_id=None, user_id=None, role=None) -> None:
    if not _is_supported_connection():
        return

    values = {
        "app.current_tenant": str(tenant_id) if tenant_id else "",
        "app.current_user_id": str(user_id) if user_id else "",
        "app.current_role": str(role) if role else "",
    }
    for key, value in values.items():
        _set_runtime_config(key, value)
