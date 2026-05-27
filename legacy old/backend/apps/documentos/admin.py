from django.contrib import admin
from django.utils.html import format_html

from apps.documentos.models import DocumentoViajero


@admin.register(DocumentoViajero)
class DocumentoViajeroAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo", "inscripcion", "estado_badge", "obligatorio", "fecha_revision")
    list_filter = ("estado", "obligatorio")
    search_fields = ("nombre", "tipo", "inscripcion__viajero__nombre", "inscripcion__viajero__email")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at")
    raw_id_fields = ("inscripcion",)

    fieldsets = (
        ("Documento", {
            "fields": ("id", "inscripcion", "nombre", "tipo", "obligatorio", "estado"),
        }),
        ("Revisión", {
            "fields": ("fecha_revision", "motivo_rechazo"),
        }),
        ("Archivo", {
            "fields": ("url",),
        }),
        ("Metadata", {
            "fields": ("metadata",),
            "classes": ("collapse",),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    ESTADO_COLORS = {
        "pendiente":   "#f59e0b",
        "en_revision": "#2563eb",
        "aprobado":    "#16a34a",
        "rechazado":   "#dc2626",
    }

    @admin.display(description="Estado")
    def estado_badge(self, obj):
        color = self.ESTADO_COLORS.get(obj.estado, "#6b7280")
        return format_html(
            '<span style="color:white;background:{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.estado
        )
