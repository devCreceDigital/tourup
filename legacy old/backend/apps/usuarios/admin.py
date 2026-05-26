from django.contrib import admin
from django.utils.html import format_html

from apps.usuarios.models import Perfil


@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ("nombre", "email", "rol_badge", "tenant_id", "is_active", "created_at")
    list_filter = ("rol", "is_active")
    search_fields = ("nombre", "email")
    ordering = ("nombre",)
    readonly_fields = ("id", "created_at")

    fieldsets = (
        ("Datos personales", {
            "fields": ("id", "nombre", "email", "rol", "is_active"),
        }),
        ("Tenant", {
            "fields": ("tenant_id",),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Rol")
    def rol_badge(self, obj):
        colors = {
            "superadmin": "#7c3aed",
            "admin":      "#2563eb",
            "usuario":    "#6b7280",
        }
        color = colors.get(obj.rol, "#6b7280")
        return format_html(
            '<span style="color:white;background:{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.rol
        )
