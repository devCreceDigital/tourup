from django.utils import timezone
from rest_framework import serializers
from apps.pagos.models import Cuota, Pago


class CuotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuota
        fields = ["id", "viaje", "nombre", "monto", "fecha_vencimiento", "obligatoria"]
        read_only_fields = ["id"]


class PagoListSerializer(serializers.ModelSerializer):
    cuota_nombre = serializers.CharField(source="cuota.nombre", read_only=True, allow_null=True)
    viajero_nombre = serializers.CharField(source="inscripcion.viajero.nombre", read_only=True)
    viajero_email = serializers.CharField(source="inscripcion.viajero.email", read_only=True)
    viaje_nombre = serializers.CharField(source="inscripcion.viaje.nombre", read_only=True)
    cuota_fecha_vencimiento = serializers.DateField(source="cuota.fecha_vencimiento", read_only=True, allow_null=True)

    class Meta:
        model = Pago
        fields = [
            "id",
            "inscripcion",
            "cuota",
            "cuota_nombre",
            "cuota_fecha_vencimiento",
            "monto",
            "metodo",
            "estado",
            "referencia",
            "notas",
            "viajero_nombre",
            "viajero_email",
            "viaje_nombre",
            "pagado_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PagoManualSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = ["cuota", "monto", "metodo", "referencia", "notas"]

    def create(self, validated_data):
        inscripcion = self.context["inscripcion"]
        return Pago.objects.create(
            inscripcion=inscripcion,
            estado=Pago.ESTADO_VERIFICADO,
            pagado_at=timezone.now(),
            created_at=timezone.now(),
            **validated_data,
        )
