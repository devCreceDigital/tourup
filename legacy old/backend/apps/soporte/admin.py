from django.contrib import admin
from django.utils.html import format_html
from apps.soporte.models import TicketSoporte


@admin.register(TicketSoporte)
class TicketSoporteAdmin(admin.ModelAdmin):
    list_display = (
        "asunto", "prioridad_badge", "estado_badge",
        "admin_email", "tenant_id", "created_at",
    )
    list_filter  = ("estado", "prioridad")
    search_fields = ("asunto", "descripcion", "admin_email")
    ordering     = ("-created_at",)
    readonly_fields = (
        "id", "created_at", "updated_at",
        "tenant_id", "admin_email", "viaje_id",
    )
    actions = ["marcar_en_progreso", "marcar_resuelto", "marcar_cerrado"]

    fieldsets = (
        ("Ticket", {
            "fields": ("id", "asunto", "descripcion", "prioridad", "estado"),
        }),
        ("Origen", {
            "fields": ("admin_email", "tenant_id", "viaje_id"),
        }),
        ("Respuesta", {
            "fields": ("respuesta",),
        }),
        ("Auditoría", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    PRIORIDAD_COLORS = {
        "baja":    "#6b7280",
        "normal":  "#2563eb",
        "urgente": "#dc2626",
    }
    ESTADO_COLORS = {
        "abierto":     "#f59e0b",
        "en_progreso": "#2563eb",
        "resuelto":    "#16a34a",
        "cerrado":     "#374151",
    }

    @admin.display(description="Prioridad")
    def prioridad_badge(self, obj):
        color = self.PRIORIDAD_COLORS.get(obj.prioridad, "#6b7280")
        return format_html(
            '<span style="color:white;background:{};padding:2px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.prioridad.upper()
        )

    @admin.display(description="Estado")
    def estado_badge(self, obj):
        color = self.ESTADO_COLORS.get(obj.estado, "#6b7280")
        return format_html(
            '<span style="color:white;background:{};padding:2px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.estado.replace("_", " ").upper()
        )

    @admin.action(description="▶ Marcar en progreso")
    def marcar_en_progreso(self, request, queryset):
        n = queryset.update(estado="en_progreso")
        self.message_user(request, f"{n} ticket(s) en progreso.")

    @admin.action(description="✅ Marcar como resuelto")
    def marcar_resuelto(self, request, queryset):
        n = queryset.update(estado="resuelto")
        self.message_user(request, f"{n} ticket(s) resueltos.")

    @admin.action(description="🔒 Cerrar tickets")
    def marcar_cerrado(self, request, queryset):
        n = queryset.update(estado="cerrado")
        self.message_user(request, f"{n} ticket(s) cerrados.")
