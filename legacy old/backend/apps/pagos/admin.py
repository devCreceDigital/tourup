from django.contrib import admin
from django.utils.html import format_html

from apps.pagos.models import Cuota, Pago


class PagoInline(admin.TabularInline):
    model = Pago
    extra = 0
    fields = ("monto", "metodo", "estado", "pagado_at")
    readonly_fields = ("monto", "metodo", "estado", "pagado_at")
    show_change_link = True
    can_delete = False


@admin.register(Cuota)
class CuotaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "viaje", "monto", "fecha_vencimiento", "obligatoria")
    list_filter = ("obligatoria",)
    search_fields = ("nombre", "viaje__nombre")
    ordering = ("fecha_vencimiento",)
    readonly_fields = ("id",)
    raw_id_fields = ("viaje",)
    inlines = [PagoInline]


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ("id_corto", "inscripcion", "monto", "metodo", "estado_badge", "pagado_at", "created_at")
    list_filter = ("estado", "metodo")
    search_fields = ("inscripcion__viajero__nombre", "inscripcion__viajero__email", "referencia")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at")
    raw_id_fields = ("inscripcion", "cuota")

    fieldsets = (
        ("Pago", {
            "fields": ("id", "inscripcion", "cuota", "monto", "metodo", "estado"),
        }),
        ("Detalles", {
            "fields": ("referencia", "notas", "pagado_at"),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    ESTADO_COLORS = {
        "pendiente":  "#f59e0b",
        "verificado": "#16a34a",
        "rechazado":  "#dc2626",
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
