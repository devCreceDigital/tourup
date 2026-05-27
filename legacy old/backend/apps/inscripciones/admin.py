from django.contrib import admin
from django.utils.html import format_html

from apps.inscripciones.models import Inscripcion


@admin.register(Inscripcion)
class InscripcionAdmin(admin.ModelAdmin):
    list_display = ("id_corto", "viajero", "viaje", "estado_badge", "tipo_habitacion", "created_at")
    list_filter = ("estado",)
    search_fields = ("viajero__nombre", "viajero__email", "viaje__nombre")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at")
    raw_id_fields = ("viajero", "viaje")
    actions = ["confirmar_inscripciones", "cancelar_inscripciones"]

    @admin.action(description="✅ Confirmar inscripciones seleccionadas")
    def confirmar_inscripciones(self, request, queryset):
        count = queryset.update(estado=Inscripcion.ESTADO_CONFIRMADO)
        self.message_user(request, f"{count} inscripción(es) confirmada(s).")

    @admin.action(description="❌ Cancelar inscripciones seleccionadas")
    def cancelar_inscripciones(self, request, queryset):
        count = queryset.update(estado=Inscripcion.ESTADO_CANCELADO)
        self.message_user(request, f"{count} inscripción(es) cancelada(s).")

    fieldsets = (
        ("Inscripción", {
            "fields": ("id", "viajero", "viaje", "estado", "tipo_habitacion"),
        }),
        ("Salud (JSON)", {
            "fields": ("datos_salud",),
            "classes": ("collapse",),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    ESTADO_COLORS = {
        "pre_inscrito":   "#f59e0b",
        "pendiente_pago": "#f97316",
        "confirmado":     "#16a34a",
        "cancelado":      "#dc2626",
    }

    @admin.display(description="Estado")
    def estado_badge(self, obj):
        color = self.ESTADO_COLORS.get(obj.estado, "#6b7280")
        return format_html(
            '<span style="color:white;background:{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.estado
        )

    @admin.display(description="ID")
    def id_corto(self, obj):
        return str(obj.id)[:8] + "..."
