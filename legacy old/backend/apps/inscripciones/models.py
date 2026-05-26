import uuid

from django.db import models


class Inscripcion(models.Model):
    ESTADO_PRE_INSCRITO = "pre_inscrito"
    ESTADO_PENDIENTE_PAGO = "pendiente_pago"
    ESTADO_CONFIRMADO = "confirmado"
    ESTADO_CANCELADO = "cancelado"

    ESTADOS = (
        (ESTADO_PRE_INSCRITO, "Pre inscrito"),
        (ESTADO_PENDIENTE_PAGO, "Pendiente pago"),
        (ESTADO_CONFIRMADO, "Confirmado"),
        (ESTADO_CANCELADO, "Cancelado"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    viajero = models.ForeignKey(
        "usuarios.Perfil",
        on_delete=models.PROTECT,
        related_name="inscripciones",
        db_column="user_id",
        null=True,
        blank=True,
    )
    viaje = models.ForeignKey(
        "viajes.Viaje",
        on_delete=models.PROTECT,
        related_name="inscripciones",
    )
    tipo_habitacion = models.CharField(max_length=20, blank=True)
    datos_salud = models.JSONField(default=dict)
    estado = models.CharField(max_length=30, choices=ESTADOS, default=ESTADO_PRE_INSCRITO, db_column="status")
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "inscripciones"
        unique_together = (("viajero", "viaje"),)
