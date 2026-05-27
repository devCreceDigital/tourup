import ipaddress
import uuid

import jwt
from django.conf import settings
from django.http import JsonResponse

from apps.tenancy.db_context import apply_db_context, reset_db_context
from apps.tenancy.models import Tenant


def _normalize_host(raw_host: str) -> str:
    host = (raw_host or "").strip().lower()
    if not host:
        return ""
    if host.startswith("[") and "]" in host:
        return host[1 : host.index("]")]
    return host.split(":", 1)[0]


def _is_ip_address(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        return False


def get_tenant_request_candidates(request):
    candidates = []

    header_name = getattr(settings, "TENANCY_HEADER_NAME", "X-Tenant-ID")
    header_value = (request.headers.get(header_name) or "").strip()
    if header_value:
        candidates.append(("header", header_value))

    # Usar HTTP_HOST crudo para no depender de ALLOWED_HOSTS durante resolucion.
    # Django validara ALLOWED_HOSTS mas adelante en el pipeline.
    raw_host = request.META.get("HTTP_HOST") or request.META.get("SERVER_NAME") or ""
    host = _normalize_host(raw_host)
    root_hosts = {item.lower() for item in getattr(settings, "TENANCY_ROOT_HOSTS", [])}
    if host and host not in root_hosts and not _is_ip_address(host):
        candidates.append(("host", host))

    jwt_tenant_id = _get_tenant_id_from_request_jwt(request)
    if jwt_tenant_id:
        candidates.append(("jwt", jwt_tenant_id))

    return candidates


def _get_bearer_token(request) -> str | None:
    auth_header = (request.headers.get("Authorization") or "").strip()
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    return token or None


def _decode_request_jwt_payload(token: str):
    try:
        unverified_payload = jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": False, "verify_aud": False},
            algorithms=["HS256"],
        )
    except jwt.InvalidTokenError:
        return None

    issuer = unverified_payload.get("iss")
    if issuer == settings.APP_JWT_ISSUER:
        secret = settings.APP_JWT_SECRET
    else:
        secret = settings.SUPABASE_JWT_SECRET

    if not secret:
        return None

    try:
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.InvalidTokenError:
        return None


def _get_tenant_id_from_request_jwt(request):
    token = _get_bearer_token(request)
    if not token:
        return None

    payload = _decode_request_jwt_payload(token)
    if not payload:
        return None

    app_metadata = payload.get("app_metadata", {}) or {}
    user_metadata = payload.get("user_metadata", {}) or {}
    tenant_id = payload.get("tenant_id") or app_metadata.get("tenant_id") or user_metadata.get("tenant_id")
    if not tenant_id:
        return None

    try:
        return str(uuid.UUID(str(tenant_id)))
    except (ValueError, TypeError, AttributeError):
        return None


def get_tenant_for_header(header_value: str):
    try:
        tenant_uuid = uuid.UUID(str(header_value))
    except (ValueError, AttributeError):
        return None
    return Tenant.objects.filter(id=tenant_uuid).first()


def get_tenant_for_host(host: str):
    return Tenant.objects.filter(domain__iexact=host).first()


def _is_tenant_active(tenant) -> bool:
    return getattr(tenant, "status", "") == Tenant.STATUS_ACTIVE


class TenantResolutionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    @staticmethod
    def _is_exempt_path(path: str) -> bool:
        exempt_prefixes = getattr(
            settings,
            "TENANCY_EXEMPT_PATH_PREFIXES",
            ["/health/", "/admin/", "/api/tenants/", "/api/debug-auth/"],
        )
        return any(path.startswith(prefix) for prefix in exempt_prefixes)

    @staticmethod
    def _error(detail: str, status_code: int):
        return JsonResponse({"detail": detail}, status=status_code)

    @staticmethod
    def _finalize_response(response):
        if getattr(response, "streaming", False):
            original_stream = response.streaming_content

            def _stream_with_reset():
                try:
                    yield from original_stream
                finally:
                    reset_db_context()

            response.streaming_content = _stream_with_reset()
            return response

        reset_db_context()
        return response

    def __call__(self, request):
        reset_db_context()
        request.tenant = None
        request.tenant_id = None
        request.tenant_source = None
        try:
            if self._is_exempt_path(request.path):
                return self._finalize_response(self.get_response(request))

            resolved_tenant = None
            resolved_source = None

            for source, raw_value in get_tenant_request_candidates(request):
                if source in {"header", "jwt"}:
                    tenant = get_tenant_for_header(raw_value)
                    if tenant is None:
                        detail = (
                            "Tenant no encontrado para X-Tenant-ID."
                            if source == "header"
                            else "Tenant no encontrado para el token solicitado."
                        )
                        return self._finalize_response(
                            self._error(detail, 401)
                        )
                else:
                    tenant = get_tenant_for_host(raw_value)
                    if tenant is None:
                        return self._finalize_response(
                            self._error("Tenant no encontrado para el host solicitado.", 401)
                        )

                if not _is_tenant_active(tenant):
                    return self._finalize_response(self._error("El tenant no esta activo.", 403))

                if resolved_tenant and str(resolved_tenant.id) != str(tenant.id):
                    return self._finalize_response(
                        self._error("Conflicto de tenant entre host, X-Tenant-ID o JWT.", 401)
                    )

                resolved_tenant = tenant
                resolved_source = source

            if resolved_tenant:
                request.tenant = resolved_tenant
                request.tenant_id = resolved_tenant.id
                request.tenant_source = resolved_source
                apply_db_context(tenant_id=resolved_tenant.id)

            return self._finalize_response(self.get_response(request))
        except Exception:
            reset_db_context()
            raise
