from django.contrib import admin
from django.utils.html import format_html

from apps.catalogo.models import Actividad, Alojamiento, Complemento, Destino


class ActividadInline(admin.TabularInline):
    model = Actividad
    extra = 0
    fields = ("nombre", "categoria", "duracion_horas", "estado")
    readonly_fields = ("nombre", "categoria", "duracion_horas", "estado")
    show_change_link = True
    can_delete = False


class AlojamientoInline(admin.TabularInline):
    model = Alojamiento
    extra = 0
    fields = ("nombre", "tipo", "categoria_estrellas", "estado")
    readonly_fields = ("nombre", "tipo", "categoria_estrellas", "estado")
    show_change_link = True
    can_delete = False


@admin.register(Destino)
class DestinoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "pais", "estado", "created_at")
    list_filter = ("estado", "pais")
    search_fields = ("nombre", "pais")
    ordering = ("nombre",)
    readonly_fields = ("id", "created_at")
    inlines = [ActividadInline, AlojamientoInline]

    fieldsets = (
        ("Información principal", {
            "fields": ("id", "nombre", "pais", "descripcion", "estado"),
        }),
        ("Ubicación", {
            "fields": ("latitud", "longitud", "url_video"),
        }),
        ("Multimedia", {
            "fields": ("imagenes",),
            "classes": ("collapse",),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )


@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    list_display = ("nombre", "categoria_badge", "destino", "duracion_horas", "proveedor", "estado")
    list_filter = ("categoria", "estado")
    search_fields = ("nombre", "descripcion", "proveedor")
    ordering = ("nombre",)
    readonly_fields = ("id", "created_at")
    raw_id_fields = ("destino",)

    fieldsets = (
        ("Información principal", {
            "fields": ("id", "nombre", "descripcion", "categoria", "estado"),
        }),
        ("Detalles", {
            "fields": ("duracion_horas", "localizacion", "proveedor", "destino"),
        }),
        ("Multimedia y horarios", {
            "fields": ("imagenes", "horarios"),
            "classes": ("collapse",),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    CATEGORIA_COLORS = {
        "cultural":     "#7c3aed",
        "deportiva":    "#f97316",
        "gastronomica": "#d97706",
        "naturaleza":   "#16a34a",
        "otro":         "#6b7280",
    }

    @admin.display(description="Categoría")
    def categoria_badge(self, obj):
        color = self.CATEGORIA_COLORS.get(obj.categoria, "#6b7280")
        return format_html(
            '<span style="color:white;background:{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.categoria
        )


@admin.register(Alojamiento)
class AlojamientoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo", "categoria_estrellas", "destino", "telefono", "estado")
    list_filter = ("tipo", "estado", "categoria_estrellas")
    search_fields = ("nombre", "direccion", "telefono", "email_contacto")
    ordering = ("nombre",)
    readonly_fields = ("id", "created_at")
    raw_id_fields = ("destino",)

    fieldsets = (
        ("Información principal", {
            "fields": ("id", "nombre", "tipo", "categoria_estrellas", "estado"),
        }),
        ("Contacto y ubicación", {
            "fields": ("destino", "direccion", "telefono", "email_contacto"),
        }),
        ("Multimedia", {
            "fields": ("imagenes",),
            "classes": ("collapse",),
        }),
        ("Auditoría", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )


@admin.register(Complemento)
class ComplementoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo", "proveedor", "estado")
    list_filter = ("tipo", "estado")
    search_fields = ("nombre", "descripcion", "proveedor")
    ordering = ("nombre",)
    readonly_fields = ("id",)

    fieldsets = (
        ("Información principal", {
            "fields": ("id", "nombre", "tipo", "descripcion", "estado"),
        }),
        ("Proveedor y documentos", {
            "fields": ("proveedor", "documentos"),
        }),
    )
