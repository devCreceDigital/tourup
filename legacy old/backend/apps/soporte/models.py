import uuid
from django.db import models

class TicketSoporte(models.Model):
    PRIORIDAD_BAJA = "baja"
    PRIORIDAD_NORMAL = "normal"
    PRIORIDAD_URGENTE = "urgente"

    ESTADO_ABIERTO = "abierto"
    ESTADO_EN_PROGRESO = "en_progreso"
    ESTADO_RESUELTO = "resuelto"
    ESTADO_CERRADO = "cerrado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(null=True, blank=True)
    admin_email = models.CharField(max_length=200, blank=True)
    asunto = models.CharField(max_length=300)
    descripcion = models.TextField()
    prioridad = models.CharField(max_length=20, default=PRIORIDAD_NORMAL)
    estado = models.CharField(max_length=20, default=ESTADO_ABIERTO)
    viaje_id = models.UUIDField(null=True, blank=True)
    respuesta = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = "tickets_soporte"
        app_label = "soporte"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.prioridad.upper()}] {self.asunto}"
