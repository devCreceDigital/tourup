from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers as drf_serializers, status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tenancy.models import Tenant, TenantConfig
from apps.tenancy.serializers import TenantSerializer
from apps.usuarios.rbac import ROLE_ADMIN, ROLE_SUPERADMIN, get_request_raw_role, get_request_profile


def _current_role(request) -> str:
    return get_request_raw_role(request)


class TenantAdminPermission(BasePermission):
    message = "No tienes permisos para administrar tenants."

    def has_permission(self, request, _view):
        return bool(
            request.user
            and getattr(request.user, "is_authenticated", False)
            and _current_role(request) in {ROLE_SUPERADMIN, ROLE_ADMIN}
        )


class TenantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, TenantAdminPermission]
    serializer_class = TenantSerializer
    queryset = Tenant.objects.all().order_by("-created_at")
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
    filterset_fields = ["status"]
    search_fields = ["name", "domain"]
    ordering_fields = ["created_at", "name", "domain", "status"]
    ordering = ["-created_at"]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]


# ── Onboarding ───────────────────────────────────────────────────────────────

STEP_FIELDS = {
    TenantConfig.STEP_EMPRESA: ["descripcion", "website", "telefono", "ruc"],
    TenantConfig.STEP_BRANDING: ["logo_url", "color_primario", "color_secundario"],
}


class TenantConfigSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model  = TenantConfig
        fields = [
            "id", "tenant_id",
            "logo_url", "color_primario", "color_secundario", "banner_url", "slogan", "dominio_custom", "redes_sociales",
            "descripcion", "website", "telefono", "ruc",
            "onboarding_step", "onboarding_completado",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "tenant_id", "created_at", "updated_at"]


class OnboardingView(APIView):
    """
    GET  /api/tenants/{tenant_id}/onboarding/  → estado actual
    POST /api/tenants/{tenant_id}/onboarding/  → guardar paso y avanzar
    """
    permission_classes = [IsAuthenticated, TenantAdminPermission]

    def _get_config(self, tenant_id):
        config, _ = TenantConfig.objects.get_or_create(
            tenant_id=tenant_id,
            defaults={"onboarding_step": TenantConfig.STEP_EMPRESA},
        )
        return config

    def get(self, request, tenant_id):
        config = self._get_config(tenant_id)
        data = TenantConfigSerializer(config).data
        tenant = Tenant.objects.filter(id=tenant_id).first()
        if tenant:
            data["dominio"] = tenant.dominio
            data["nombre"] = tenant.nombre
        return Response(data)

    def post(self, request, tenant_id):
        config = self._get_config(tenant_id)
        serializer = TenantConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        config = serializer.save()

        advance = request.data.get("advance", True)
        if advance and not config.onboarding_completado:
            next_step = config.onboarding_step + 1
            if next_step > TenantConfig.STEP_PRIMER_USUARIO:
                config.onboarding_completado = True
                config.onboarding_step = TenantConfig.STEP_COMPLETADO
            else:
                config.onboarding_step = next_step
            config.save(update_fields=["onboarding_step", "onboarding_completado"])

        return Response(TenantConfigSerializer(config).data, status=status.HTTP_200_OK)

    def patch(self, request, tenant_id):
        config = self._get_config(tenant_id)
        serializer = TenantConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TenantConfigSerializer(config).data)

class TenantPreferenciasView(APIView):
    """
    GET  /api/tenants/{tenant_id}/preferencias/  — obtener preferencias
    PATCH /api/tenants/{tenant_id}/preferencias/ — actualizar preferencias
    """
    permission_classes = [IsAuthenticated, TenantAdminPermission]

    def _get_config(self, tenant_id):
        config, _ = TenantConfig.objects.get_or_create(
            tenant_id=tenant_id,
            defaults={"onboarding_step": TenantConfig.STEP_EMPRESA},
        )
        return config

    def get(self, request, tenant_id):
        config = self._get_config(tenant_id)
        return Response({"preferencias": config.preferencias or {}})

    def patch(self, request, tenant_id):
        config = self._get_config(tenant_id)
        nuevas = request.data.get("preferencias", {})
        if not isinstance(nuevas, dict):
            return Response({"detail": "preferencias debe ser un objeto JSON."}, status=400)
        config.preferencias = {**(config.preferencias or {}), **nuevas}
        config.save(update_fields=["preferencias"])
        return Response({"preferencias": config.preferencias})
