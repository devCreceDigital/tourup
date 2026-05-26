from django.contrib import admin
from django.utils.html import format_html

from apps.viajes.models import Viaje


@admin.register(Viaje)
class ViajeAdmin(admin.ModelAdmin):
    list_display = ("nombre", "codigo", "estado_badge", "fecha_inicio", "fecha_fin", "cupos", "moneda", "tenant_id")
    list_filter = ("estado", "moneda")
    search_fields = ("nombre", "codigo", "slug")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at")
    actions = ["publicar_viajes", "pasar_a_borrador", "cancelar_viajes"]

    @admin.action(description="🌐 Publicar viajes seleccionados")
    def publicar_viajes(self, request, queryset):
        count = queryset.update(estado="publicado")
        self.message_user(request, f"{count} viaje(s) publicado(s).")

    @admin.action(description="📝 Pasar a borrador")
    def pasar_a_borrador(self, request, queryset):
        count = queryset.update(estado="borrador")
        self.message_user(request, f"{count} viaje(s) pasado(s) a borrador.")

    @admin.action(description="❌ Cancelar viajes seleccionados")
    def cancelar_viajes(self, request, queryset):
        count = queryset.update(estado="cancelado")
        self.message_user(request, f"{count} viaje(s) cancelado(s).")

    fieldsets = (
        ("Información principal", {
            "fields": ("id", "nombre", "codigo", "slug", "estado", "tenant_id"),
        }),
        ("Fechas y capacidad", {
            "fields": ("fecha_inicio", "fecha_fin", "cupos", "moneda"),
        }),
        ("Itinerario", {
            "fields": ("itinerario_id",),
        }),
        ("Configuración (JSON)", {
            "fields": ("configuracion",),
            "classes": ("collapse",),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    ESTADO_COLORS = {
        "borrador":     "#6b7280",
        "confirmado":   "#2563eb",
        "publicado":    "#16a34a",
        "en_operacion": "#7c3aed",
        "cerrado":      "#374151",
        "cancelado":    "#dc2626",
    }

    @admin.display(description="Estado")
    def estado_badge(self, obj):
        color = self.ESTADO_COLORS.get(obj.estado, "#6b7280")
        return format_html(
            '<span style="color:white;background:{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.estado
        )
