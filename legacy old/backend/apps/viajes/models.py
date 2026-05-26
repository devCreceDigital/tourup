import uuid

from django.db import models


class Viaje(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField()
    itinerario_id = models.UUIDField(null=True, blank=True)
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=50)
    slug = models.SlugField(max_length=100)
    estado = models.CharField(max_length=30, db_column="status", default="borrador")
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    cupos = models.IntegerField(db_column="cupo_maximo", null=True, blank=True)
    moneda = models.CharField(max_length=3, default="USD")
    configuracion = models.JSONField(default=dict)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "viajes"

    def __str__(self):
        return self.nombre
