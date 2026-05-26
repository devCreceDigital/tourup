import uuid
from django.db import models


class Itinerario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(null=True, blank=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, default="")
    version = models.IntegerField(default=1)
    estado = models.CharField(max_length=20, default="activo")
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "itinerarios"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.nombre} v{self.version}"


class DiaItinerario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    itinerario = models.ForeignKey(
        Itinerario,
        on_delete=models.CASCADE,
        related_name="dias",
    )
    numero_dia = models.IntegerField()
    titulo = models.CharField(max_length=200)
    resumen = models.TextField(blank=True, default="")
    alojamiento_pernocta = models.CharField(max_length=200, blank=True, default="")
    destino_nombre = models.CharField(max_length=200, blank=True, default="")

    class Meta:
        managed = False
        db_table = "dias_itinerario"
        ordering = ["numero_dia"]
        unique_together = (("itinerario", "numero_dia"),)

    def __str__(self):
        return f"Día {self.numero_dia}: {self.titulo}"


class EventoItinerario(models.Model):
    TIPO_TEXTO = "texto_libre"
    TIPO_ACTIVIDAD = "actividad_catalogo"

    TIPOS = (
        (TIPO_TEXTO, "Texto libre"),
        (TIPO_ACTIVIDAD, "Actividad del catálogo"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dia = models.ForeignKey(
        DiaItinerario,
        on_delete=models.CASCADE,
        related_name="eventos",
    )
    tipo = models.CharField(max_length=30, choices=TIPOS, default=TIPO_TEXTO)
    descripcion = models.TextField(blank=True, default="")
    hora_inicio = models.TimeField(null=True, blank=True)
    hora_fin = models.TimeField(null=True, blank=True)
    actividad_id = models.UUIDField(null=True, blank=True)
    orden = models.IntegerField(default=0)

    class Meta:
        managed = False
        db_table = "eventos_itinerario"
        ordering = ["orden", "hora_inicio"]

    def __str__(self):
        return f"{self.tipo}: {self.descripcion[:50]}"
