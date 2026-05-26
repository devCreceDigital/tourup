from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.tenancy.models import Tenant, TenantConfig
from apps.viajes.models import Viaje
from apps.viajes.serializers import ViajeSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def pagina_agencia(request, dominio):
    """Devuelve toda la info pública de una agencia por su dominio."""
    tenant = Tenant.objects.filter(dominio=dominio).first()
    if not tenant:
        # Buscar por dominio custom
        config_custom = TenantConfig.objects.filter(dominio_custom=dominio).first()
        if config_custom:
            tenant = Tenant.objects.filter(id=config_custom.tenant_id).first()
    if not tenant:
        return Response({"error": "Agencia no encontrada"}, status=404)

    config = TenantConfig.objects.filter(tenant_id=tenant.id).first()
    viajes = Viaje.objects.filter(tenant_id=tenant.id, estado="publicado").order_by("-created_at")

    return Response({
        "agencia": {
            "id":              str(tenant.id),
            "nombre":          tenant.nombre,
            "dominio":         tenant.dominio,
            "dominio_custom":  getattr(config, "dominio_custom", None),
            "logo_url":        getattr(config, "logo_url", None),
            "banner_url":      getattr(config, "banner_url", None),
            "slogan":          getattr(config, "slogan", ""),
            "descripcion":     getattr(config, "descripcion", ""),
            "color_primario":  getattr(config, "color_primario", "#5B4FE8"),
            "color_secundario":getattr(config, "color_secundario", "#1a1a2e"),
            "website":         getattr(config, "website", ""),
            "telefono":        getattr(config, "telefono", ""),
            "redes_sociales":  getattr(config, "redes_sociales", {}),
            "preferencias":    getattr(config, "preferencias", {}),
        },
        "viajes": ViajeSerializer(viajes, many=True).data,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def lista_agencias(request):
    """Lista todas las agencias activas para el directorio."""
    tenants = Tenant.objects.filter(status="activo").order_by("nombre")
    result = []
    for t in tenants:
        config = TenantConfig.objects.filter(tenant_id=t.id).first()
        result.append({
            "id":           str(t.id),
            "nombre":       t.nombre,
            "dominio":      t.dominio,
            "logo_url":     getattr(config, "logo_url", None),
            "banner_url":   getattr(config, "banner_url", None),
            "slogan":       getattr(config, "slogan", ""),
            "color_primario": getattr(config, "color_primario", "#5B4FE8"),
            "viajes_count": Viaje.objects.filter(tenant_id=t.id, estado="publicado").count(),
        })
    return Response(result)


@api_view(["GET"])
@permission_classes([AllowAny])
def agencia_by_tenant(request, tenant_id):
    tenant = Tenant.objects.filter(id=tenant_id).first()
    if not tenant:
        return Response({"error": "No encontrado"}, status=404)
    config = TenantConfig.objects.filter(tenant_id=tenant_id).first()
    return Response({
        "agencia": {
            "id":              str(tenant.id),
            "nombre":          tenant.nombre,
            "dominio":         tenant.dominio,
            "logo_url":        getattr(config, "logo_url", None),
            "banner_url":      getattr(config, "banner_url", None),
            "slogan":          getattr(config, "slogan", ""),
            "color_primario":  getattr(config, "color_primario", "#5B4FE8"),
            "color_secundario":getattr(config, "color_secundario", "#1a1a2e"),
            "website":         getattr(config, "website", ""),
            "telefono":        getattr(config, "telefono", ""),
            "redes_sociales":  getattr(config, "redes_sociales", {}),
        }
    })
