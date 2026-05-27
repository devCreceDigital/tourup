"""
Permisos DRF reutilizables para toda la plataforma.
Reemplaza los helpers _current_role() duplicados en cada app.
"""
from rest_framework.permissions import BasePermission


def _get_role(request) -> str:
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return ""
    rol = (getattr(user, "rol", "") or "").lower()
    if rol in {"superadmin"}:
        return "superadmin"
    if rol in {"admin"}:
        return "admin"
    if rol:
        return "viajero"
    return ""


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return _get_role(request) == "superadmin"


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return _get_role(request) in {"admin", "superadmin"}


class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return bool(_get_role(request))


class IsOwnerOrAdmin(BasePermission):
    """
    Permite acceso si el usuario es admin/superadmin O es el dueño del objeto.
    El objeto debe tener un atributo `viajero_id` o `perfil_id` que se compare
    con el id del usuario autenticado.
    """
    owner_field = "viajero_id"

    def has_object_permission(self, request, view, obj):
        role = _get_role(request)
        if role in {"admin", "superadmin"}:
            return True
        user = getattr(request, "user", None)
        if not user:
            return False
        owner_id = getattr(obj, self.owner_field, None)
        return str(owner_id) == str(getattr(user, "id", ""))


class TenantIsolationPermission(BasePermission):
    """
    Valida que el tenant del request coincida con el tenant del objeto.
    El objeto debe tener un atributo `tenant_id`.
    """
    def has_object_permission(self, request, view, obj):
        request_tenant = getattr(request, "tenant_id", None)
        if not request_tenant:
            return True  # sin tenant en request → no aplicar aislamiento
        obj_tenant = getattr(obj, "tenant_id", None)
        if not obj_tenant:
            return True
        return str(request_tenant) == str(obj_tenant)
