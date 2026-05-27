from django.contrib import admin
from django.utils.html import format_html

from apps.tenancy.models import Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("nombre", "dominio", "status_badge", "plan_id", "created_at")
    list_filter = ("status",)
    search_fields = ("nombre", "dominio")
    ordering = ("nombre",)
    readonly_fields = ("id", "created_at")
    actions = ["activar_tenants", "suspender_tenants", "desactivar_tenants"]

    @admin.action(description="✅ Activar agencias seleccionadas")
    def activar_tenants(self, request, queryset):
        count = queryset.update(status=Tenant.STATUS_ACTIVE)
        self.message_user(request, f"{count} agencia(s) activada(s).")

    @admin.action(description="⏸️ Suspender agencias seleccionadas")
    def suspender_tenants(self, request, queryset):
        count = queryset.update(status=Tenant.STATUS_SUSPENDED)
        self.message_user(request, f"{count} agencia(s) suspendida(s).")

    @admin.action(description="🚫 Desactivar agencias seleccionadas")
    def desactivar_tenants(self, request, queryset):
        count = queryset.update(status=Tenant.STATUS_INACTIVE)
        self.message_user(request, f"{count} agencia(s) desactivada(s).")

    fieldsets = (
        ("Información principal", {
            "fields": ("id", "nombre", "dominio", "status"),
        }),
        ("Suscripción", {
            "fields": ("plan_id",),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Estado")
    def status_badge(self, obj):
        colors = {
            Tenant.STATUS_ACTIVE: "#16a34a",
            Tenant.STATUS_INACTIVE: "#6b7280",
            Tenant.STATUS_SUSPENDED: "#dc2626",
        }
        labels = {
            Tenant.STATUS_ACTIVE: "Activo",
            Tenant.STATUS_INACTIVE: "Inactivo",
            Tenant.STATUS_SUSPENDED: "Suspendido",
        }
        color = colors.get(obj.status, "#6b7280")
        label = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="color:white;background:{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, label
        )
