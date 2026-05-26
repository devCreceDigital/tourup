from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.tenancy.models import Tenant, TenantConfig
from apps.usuarios.models import Perfil
from apps.viajes.models import Viaje
from apps.inscripciones.models import Inscripcion
from apps.soporte.models import TicketSoporte


def is_superadmin(request):
    perfil = getattr(request, "perfil", None)
    if perfil:
        return perfil.rol == "superadmin"
    email = getattr(request.user, "email", None)
    if email:
        try:
            p = Perfil.objects.get(email=email)
            return p.rol == "superadmin"
        except Perfil.DoesNotExist:
            pass
    return False


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stats_view(request):
    if not is_superadmin(request):
        return Response({"detail": "Forbidden"}, status=403)

    total_agencias      = Tenant.objects.count()
    agencias_activas    = Tenant.objects.filter(status=Tenant.STATUS_ACTIVE).count()
    total_usuarios      = Perfil.objects.count()
    total_viajes        = Viaje.objects.filter(estado="publicado").count()
    total_inscripciones = Inscripcion.objects.count()
    tickets_abiertos    = TicketSoporte.objects.filter(estado="abierto").count()
    ingresos_estimados  = Inscripcion.objects.count() * 0  # placeholder

    return Response({
        "total_agencias":      total_agencias,
        "agencias_activas":    agencias_activas,
        "agencias_inactivas":  Tenant.objects.filter(status=Tenant.STATUS_INACTIVE).count(),
        "agencias_suspendidas": Tenant.objects.filter(status=Tenant.STATUS_SUSPENDED).count(),
        "total_usuarios":      total_usuarios,
        "total_viajes":        total_viajes,
        "total_inscripciones": total_inscripciones,
        "tickets_abiertos":    tickets_abiertos,
        "tickets_urgentes":    TicketSoporte.objects.filter(estado="abierto", prioridad="urgente").count(),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def tenants_list(request):
    if not is_superadmin(request):
        return Response({"detail": "Forbidden"}, status=403)

    tenants = Tenant.objects.all().order_by("-created_at")

    # Cargar configs en bulk para evitar N+1
    tenant_ids = [t.id for t in tenants]
    configs = {c.tenant_id: c for c in TenantConfig.objects.filter(tenant_id__in=tenant_ids)}

    data = []
    for t in tenants:
        cfg = configs.get(t.id)
        viajes_count = Viaje.objects.filter(tenant_id=t.id).count()
        viajes_publicados = Viaje.objects.filter(tenant_id=t.id, estado="publicado").count()
        data.append({
            "id":                str(t.id),
            "name":              t.nombre,
            "domain":            t.dominio,
            "status":            t.status,
            "plan_id":           str(t.plan_id) if t.plan_id else None,
            "created_at":        t.created_at.isoformat(),
            "logo_url":          cfg.logo_url if cfg else None,
            "color_primario":    cfg.color_primario if cfg else "#5B4FE8",
            "slogan":            cfg.slogan if cfg else "",
            "total_viajes":      viajes_count,
            "viajes_publicados": viajes_publicados,
            "onboarding_completado": cfg.onboarding_completado if cfg else False,
        })
    return Response(data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def tenant_detail(request, tenant_id):
    if not is_superadmin(request):
        return Response({"detail": "Forbidden"}, status=403)

    try:
        tenant = Tenant.objects.get(id=tenant_id)
    except Tenant.DoesNotExist:
        return Response({"detail": "No encontrado"}, status=404)

    if request.method == "GET":
        cfg = TenantConfig.objects.filter(tenant_id=tenant_id).first()
        viajes = Viaje.objects.filter(tenant_id=tenant_id).order_by("-created_at")[:5]
        usuarios = Perfil.objects.filter(tenant_id=tenant_id)
        return Response({
            "id":             str(tenant.id),
            "name":           tenant.nombre,
            "domain":         tenant.dominio,
            "status":         tenant.status,
            "created_at":     tenant.created_at.isoformat(),
            "logo_url":       cfg.logo_url if cfg else None,
            "color_primario": cfg.color_primario if cfg else "#5B4FE8",
            "slogan":         cfg.slogan if cfg else "",
            "descripcion":    cfg.descripcion if cfg else "",
            "telefono":       cfg.telefono if cfg else "",
            "website":        cfg.website if cfg else "",
            "total_viajes":   Viaje.objects.filter(tenant_id=tenant_id).count(),
            "total_usuarios": usuarios.count(),
            "total_inscripciones": Inscripcion.objects.filter(
                viaje_id__in=Viaje.objects.filter(tenant_id=tenant_id).values("id")
            ).count(),
            "viajes_recientes": [{
                "id": str(v.id), "nombre": v.nombre, "estado": v.estado,
                "fecha_inicio": v.fecha_inicio.isoformat() if v.fecha_inicio else None,
            } for v in viajes],
            "usuarios": [{
                "nombre": u.nombre, "email": u.email, "rol": u.rol,
            } for u in usuarios],
        })

    # PATCH — cambiar status
    nuevo_status = request.data.get("status")
    VALID = [Tenant.STATUS_ACTIVE, Tenant.STATUS_INACTIVE, Tenant.STATUS_SUSPENDED]
    if nuevo_status not in VALID:
        return Response({"detail": f"Estado inválido. Usa: {VALID}"}, status=400)

    tenant.status = nuevo_status
    tenant.save(update_fields=["status"])
    return Response({"id": str(tenant.id), "status": tenant.status})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def usuarios_list(request):
    if not is_superadmin(request):
        return Response({"detail": "Forbidden"}, status=403)

    perfiles = Perfil.objects.all().order_by("-created_at")
    data = [{
        "id":         str(p.id),
        "nombre":     p.nombre,
        "email":      p.email,
        "rol":        p.rol,
        "tenant_id":  str(p.tenant_id) if p.tenant_id else None,
        "is_active":  p.is_active,
        "created_at": p.created_at.isoformat(),
    } for p in perfiles]
    return Response(data)
