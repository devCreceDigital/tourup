import uuid
from django.db import models


class DocumentoViajero(models.Model):
    ESTADO_PENDIENTE = "pendiente"
    ESTADO_EN_REVISION = "en_revision"
    ESTADO_APROBADO = "aprobado"
    ESTADO_RECHAZADO = "rechazado"

    ESTADOS = (
        (ESTADO_PENDIENTE, "Pendiente"),
        (ESTADO_EN_REVISION, "En revisión"),
        (ESTADO_APROBADO, "Aprobado"),
        (ESTADO_RECHAZADO, "Rechazado"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inscripcion = models.ForeignKey(
        "inscripciones.Inscripcion",
        on_delete=models.CASCADE,
        related_name="documentos",
    )
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=80, blank=True, null=True)
    url = models.TextField(db_column="url_archivo")
    obligatorio = models.BooleanField(default=True)
    estado = models.CharField(max_length=30, choices=ESTADOS, default=ESTADO_PENDIENTE, db_column="status")
    motivo_rechazo = models.TextField(blank=True, null=True)
    fecha_revision = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(db_column="updated_at")

    class Meta:
        managed = False
        db_table = "documentos"

    def __str__(self):
        return f"{self.tipo} — {self.estado}"
