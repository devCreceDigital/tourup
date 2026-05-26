from django.contrib import admin
from django.utils.html import format_html

from apps.planes.models import Plan


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("nombre", "price_monthly", "price_yearly", "max_trips", "max_inscriptions", "activo_badge", "created_at")
    list_filter = ("is_active",)
    search_fields = ("nombre", "description")
    ordering = ("nombre",)
    readonly_fields = ("id", "created_at")

    fieldsets = (
        ("Información del plan", {
            "fields": ("id", "nombre", "description", "is_active"),
        }),
        ("Precios", {
            "fields": ("price_monthly", "price_yearly"),
        }),
        ("Límites", {
            "fields": ("max_trips", "max_inscriptions"),
        }),
        ("Features (JSON)", {
            "fields": ("features",),
            "classes": ("collapse",),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Activo")
    def activo_badge(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="color:white;background:#16a34a;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">Sí</span>'
            )
        return format_html(
            '<span style="color:white;background:#6b7280;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">No</span>'
        )
