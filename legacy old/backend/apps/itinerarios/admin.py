from django.contrib import admin
from django.utils.html import format_html

from apps.itinerarios.models import DiaItinerario, EventoItinerario, Itinerario


class EventoItinerarioInline(admin.TabularInline):
    model = EventoItinerario
    extra = 0
    fields = ("orden", "tipo", "descripcion", "hora_inicio", "hora_fin")
    ordering = ("orden", "hora_inicio")


class DiaItinerarioInline(admin.TabularInline):
    model = DiaItinerario
    extra = 0
    fields = ("numero_dia", "titulo", "destino_nombre", "alojamiento_pernocta")
    ordering = ("numero_dia",)
    show_change_link = True


@admin.register(Itinerario)
class ItinerarioAdmin(admin.ModelAdmin):
    list_display = ("nombre", "version_badge", "estado_badge", "total_dias", "created_at")
    list_filter = ("estado", "version")
    search_fields = ("nombre", "descripcion")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at")
    inlines = [DiaItinerarioInline]

    fieldsets = (
        ("Información principal", {
            "fields": ("id", "nombre", "descripcion", "estado", "version"),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Días")
    def total_dias(self, obj):
        return obj.dias.count()

    @admin.display(description="Versión")
    def version_badge(self, obj):
        return format_html(
            '<span style="color:#1d4ed8;background:#dbeafe;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">v{}</span>',
            obj.version
        )

    @admin.display(description="Estado")
    def estado_badge(self, obj):
        colors = {
            "activo":    "#16a34a",
            "inactivo":  "#6b7280",
            "archivado": "#d97706",
        }
        color = colors.get(obj.estado, "#6b7280")
        return format_html(
            '<span style="color:white;background:{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.estado
        )


@admin.register(DiaItinerario)
class DiaItinerarioAdmin(admin.ModelAdmin):
    list_display = ("numero_dia", "titulo", "itinerario", "destino_nombre", "alojamiento_pernocta")
    list_filter = ("itinerario",)
    search_fields = ("titulo", "destino_nombre", "itinerario__nombre")
    ordering = ("itinerario", "numero_dia")
    readonly_fields = ("id",)
    raw_id_fields = ("itinerario",)
    inlines = [EventoItinerarioInline]
