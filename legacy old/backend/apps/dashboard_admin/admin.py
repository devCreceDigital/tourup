from django.contrib import admin
from django.db.models import Count, Q
from django.template.response import TemplateResponse
from django.urls import path
from django.utils import timezone


class TotemAdminSite(admin.AdminSite):
    site_header = "Totem HUB"
    site_title = "Totem HUB Admin"
    index_title = "Panel de administración"

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path("dashboard/", self.admin_view(self.dashboard_view), name="dashboard"),
        ]
        return custom + urls

    def dashboard_view(self, request):
        from apps.tenancy.models import Tenant
        from apps.planes.models import Plan
        from apps.usuarios.models import Perfil
        from apps.viajes.models import Viaje
        from apps.inscripciones.models import Inscripcion
        from apps.pagos.models import Pago
        from apps.itinerarios.models import Itinerario

        try:
            tenants_total     = Tenant.objects.count()
            tenants_activos   = Tenant.objects.filter(status="active").count()
            planes_total      = Plan.objects.count()
            usuarios_total    = Perfil.objects.count()
            admins_total      = Perfil.objects.filter(rol="admin").count()
            viajes_total      = Viaje.objects.count()
            viajes_publicados = Viaje.objects.filter(estado="publicado").count()
            viajes_borrador   = Viaje.objects.filter(estado="borrador").count()
            inscrip_total     = Inscripcion.objects.count()
            inscrip_confirm   = Inscripcion.objects.filter(estado="confirmado").count()
            pagos_total       = Pago.objects.count()
            pagos_verificados = Pago.objects.filter(estado="verificado").count()
            itinerarios_total = Itinerario.objects.count()

            viajes_recientes = Viaje.objects.order_by("-created_at")[:5]
            inscrip_recientes = Inscripcion.objects.select_related("viajero", "viaje").order_by("-created_at")[:5]
            pagos_recientes   = Pago.objects.select_related("inscripcion").order_by("-created_at")[:5]

        except Exception:
            tenants_total = tenants_activos = planes_total = 0
            usuarios_total = admins_total = 0
            viajes_total = viajes_publicados = viajes_borrador = 0
            inscrip_total = inscrip_confirm = 0
            pagos_total = pagos_verificados = 0
            itinerarios_total = 0
            viajes_recientes = inscrip_recientes = pagos_recientes = []

        context = {
            **self.each_context(request),
            "title": "Dashboard",
            "stats": {
                "tenants_total":     tenants_total,
                "tenants_activos":   tenants_activos,
                "planes_total":      planes_total,
                "usuarios_total":    usuarios_total,
                "admins_total":      admins_total,
                "viajes_total":      viajes_total,
                "viajes_publicados": viajes_publicados,
                "viajes_borrador":   viajes_borrador,
                "inscrip_total":     inscrip_total,
                "inscrip_confirm":   inscrip_confirm,
                "pagos_total":       pagos_total,
                "pagos_verificados": pagos_verificados,
                "itinerarios_total": itinerarios_total,
            },
            "viajes_recientes":   viajes_recientes,
            "inscrip_recientes":  inscrip_recientes,
            "pagos_recientes":    pagos_recientes,
        }
        return TemplateResponse(request, "admin/dashboard.html", context)
