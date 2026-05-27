import logging
import threading

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("audit")
_write_lock = threading.Lock()


def _get_client_ip(request) -> str | None:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_audit(
    evento: str,
    request=None,
    *,
    user_id=None,
    user_email=None,
    tenant_id=None,
    role: str = "",
    entidad_tipo: str = "",
    entidad_id="",
    payload: dict | None = None,
) -> None:
    """
    Escribe un AuditLog de forma segura desde cualquier parte del código.

    Uso mínimo:
        log_audit(AuditLog.EVENTO_LOGIN, request)

    Uso completo:
        log_audit(
            AuditLog.EVENTO_PAGO_MANUAL, request,
            entidad_tipo="Pago", entidad_id=pago.id,
            payload={"monto": 150, "metodo": "transferencia"},
        )
    """
    from apps.audit.models import AuditLog

    ip = user_agent = None

    if request:
        ip         = _get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]
        user       = getattr(request, "user", None)
        if user and getattr(user, "is_authenticated", False):
            user_id    = user_id    or getattr(user, "id", None)
            user_email = user_email or getattr(user, "email", None)
            role       = role       or getattr(user, "rol", "")
        tenant_id = tenant_id or getattr(request, "tenant_id", None)

    def _write():
        try:
            AuditLog.objects.create(
                user_id      = user_id,
                user_email   = user_email,
                tenant_id    = tenant_id,
                role         = role or "",
                evento       = evento,
                entidad_tipo = entidad_tipo,
                entidad_id   = str(entidad_id) if entidad_id else "",
                payload      = payload or {},
                ip           = ip,
                user_agent   = user_agent or "",
            )
        except Exception as exc:
            logger.error("Error escribiendo audit log: %s", exc)

    # Escritura asíncrona para no bloquear la request
    t = threading.Thread(target=_write, daemon=True)
    t.start()


class AuditMiddleware(MiddlewareMixin):
    """Registra automáticamente accesos denegados (403)."""

    def process_response(self, request, response):
        if response.status_code == 403:
            log_audit(
                "acceso_denegado",
                request,
                payload={"path": request.path, "method": request.method, "status": 403},
            )
        return response
