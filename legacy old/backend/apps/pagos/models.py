import uuid
from django.db import models


class Cuota(models.Model):
    """Plan de cuotas de un viaje."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    viaje = models.ForeignKey(
        "viajes.Viaje",
        on_delete=models.CASCADE,
        related_name="cuotas",
    )
    nombre = models.CharField(max_length=100)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_vencimiento = models.DateField(db_column="vencimiento")
    obligatoria = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = "cuotas"
        ordering = ["fecha_vencimiento"]

    def __str__(self):
        return f"{self.nombre} — {self.monto}"


class Pago(models.Model):
    METODO_TRANSFERENCIA = "transferencia"
    METODO_EFECTIVO = "efectivo"
    METODO_TARJETA = "tarjeta"
    METODO_MERCADOPAGO = "mercadopago"
    METODO_OTRO = "otro"

    METODOS = (
        (METODO_TRANSFERENCIA, "Transferencia bancaria"),
        (METODO_EFECTIVO, "Efectivo"),
        (METODO_TARJETA, "Tarjeta"),
        (METODO_MERCADOPAGO, "MercadoPago"),
        (METODO_OTRO, "Otro"),
    )

    ESTADO_PENDIENTE = "pendiente"
    ESTADO_VERIFICADO = "verificado"
    ESTADO_RECHAZADO = "rechazado"

    ESTADOS = (
        (ESTADO_PENDIENTE, "Pendiente"),
        (ESTADO_VERIFICADO, "Verificado"),
        (ESTADO_RECHAZADO, "Rechazado"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inscripcion = models.ForeignKey(
        "inscripciones.Inscripcion",
        on_delete=models.CASCADE,
        related_name="pagos",
    )
    cuota = models.ForeignKey(
        Cuota,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pagos",
    )
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    metodo = models.CharField(max_length=50, choices=METODOS, default=METODO_TRANSFERENCIA)
    estado = models.CharField(max_length=30, choices=ESTADOS, default=ESTADO_PENDIENTE, db_column="status")
    referencia = models.CharField(max_length=200, blank=True, null=True, db_column="referencia_psp")
    notas = models.TextField(blank=True, default="")
    pagado_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "pagos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pago S/{self.monto} [{self.estado}]"
