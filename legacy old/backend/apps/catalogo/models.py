import uuid
from django.db import models


class Destino(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200)
    pais = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, default="")
    latitud = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitud = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    url_video = models.URLField(max_length=500, blank=True, default="")
    imagenes = models.JSONField(default=list)
    estado = models.CharField(max_length=20, default="activo")
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "destinos"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre}, {self.pais}"


class Actividad(models.Model):
    CATEGORIA_CULTURAL = "cultural"
    CATEGORIA_DEPORTIVA = "deportiva"
    CATEGORIA_GASTRONOMICA = "gastronomica"
    CATEGORIA_NATURALEZA = "naturaleza"
    CATEGORIA_OTRO = "otro"

    CATEGORIAS = (
        (CATEGORIA_CULTURAL, "Cultural"),
        (CATEGORIA_DEPORTIVA, "Deportiva"),
        (CATEGORIA_GASTRONOMICA, "Gastronómica"),
        (CATEGORIA_NATURALEZA, "Naturaleza"),
        (CATEGORIA_OTRO, "Otro"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, default="")
    categoria = models.CharField(max_length=30, choices=CATEGORIAS, default=CATEGORIA_OTRO)
    duracion_horas = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    localizacion = models.CharField(max_length=200, blank=True, default="")
    proveedor = models.CharField(max_length=200, blank=True, default="")
    imagenes = models.JSONField(default=list)
    horarios = models.JSONField(default=list)
    destino = models.ForeignKey(
        Destino,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="actividades",
    )
    estado = models.CharField(max_length=20, default="activo")
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "actividades"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Alojamiento(models.Model):
    TIPO_HOTEL = "hotel"
    TIPO_HOSTAL = "hostal"
    TIPO_ALBERGUE = "albergue"
    TIPO_OTRO = "otro"

    TIPOS = (
        (TIPO_HOTEL, "Hotel"),
        (TIPO_HOSTAL, "Hostal"),
        (TIPO_ALBERGUE, "Albergue"),
        (TIPO_OTRO, "Otro"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200)
    tipo = models.CharField(max_length=30, choices=TIPOS, default=TIPO_HOTEL)
    categoria_estrellas = models.IntegerField(null=True, blank=True)
    destino = models.ForeignKey(
        Destino,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alojamientos",
    )
    direccion = models.CharField(max_length=300, blank=True, default="")
    telefono = models.CharField(max_length=50, blank=True, default="")
    email_contacto = models.EmailField(blank=True, default="")
    imagenes = models.JSONField(default=list)
    estado = models.CharField(max_length=20, default="activo")
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "alojamientos"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Complemento(models.Model):
    TIPO_SEGURO = "seguro"
    TIPO_MENU = "menu"
    TIPO_ACTIVIDAD_EXTRA = "actividad_extra"
    TIPO_PRODUCTO = "producto"

    TIPOS = (
        (TIPO_SEGURO, "Seguro"),
        (TIPO_MENU, "Menú"),
        (TIPO_ACTIVIDAD_EXTRA, "Actividad extra"),
        (TIPO_PRODUCTO, "Producto"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200)
    tipo = models.CharField(max_length=30, choices=TIPOS, default=TIPO_PRODUCTO)
    descripcion = models.TextField(blank=True, default="")
    proveedor = models.CharField(max_length=200, blank=True, default="")
    documentos = models.JSONField(default=list)
    estado = models.CharField(max_length=20, default="activo")
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "complementos"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"
