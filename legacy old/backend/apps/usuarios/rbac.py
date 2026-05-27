from django.contrib.auth.models import AnonymousUser

from apps.usuarios.models import Perfil


ROLE_SUPERADMIN = "superadmin"
ROLE_ADMIN = "admin"
ROLE_STAFF = "staff"
ROLE_USER = "user"

LEGACY_ROLE_MAP = {
    "superadmin": ROLE_SUPERADMIN,
    "admin": ROLE_ADMIN,
    "staff": ROLE_STAFF,
    "user": ROLE_USER,
    "profesor": ROLE_STAFF,
    "alumno": ROLE_USER,
    "usuario": ROLE_USER,
}


def normalize_role(raw_role: str | None) -> str:
    role = (raw_role or "").strip().lower()
    return LEGACY_ROLE_MAP.get(role, ROLE_USER)


def get_request_profile(request):
    cached = getattr(request, "_perfil_cache", None)
    if cached is not None:
        return cached

    perfil = None
    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False) and not isinstance(user, AnonymousUser):
        email = getattr(user, "email", None)
        if email:
            perfil = Perfil.objects.filter(email=email).first()

    if perfil is None:
        query_params = getattr(request, "query_params", None) or getattr(request, "GET", {})
        perfil_id = query_params.get("perfil_id")
        if perfil_id:
            perfil = Perfil.objects.filter(id=perfil_id).first()

    request._perfil_cache = perfil
    return perfil


def get_request_raw_role(request) -> str:
    user_role = (getattr(getattr(request, "user", None), "rol", "") or "").strip().lower()
    if user_role:
        return user_role
    perfil = get_request_profile(request)
    return (getattr(perfil, "rol", "") or "").strip().lower()


def get_request_role(request) -> str:
    return normalize_role(get_request_raw_role(request))


def has_any_role(request, *allowed_roles: str) -> bool:
    normalized_allowed = {normalize_role(role) for role in allowed_roles}
    return get_request_role(request) in normalized_allowed


def is_superadmin(request) -> bool:
    return get_request_raw_role(request) == ROLE_SUPERADMIN


def can_access_owned_resource(request, owner_id) -> bool:
    perfil = get_request_profile(request)
    return bool(perfil and str(getattr(perfil, "id", "")) == str(owner_id))
