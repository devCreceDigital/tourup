from django.utils import timezone
from rest_framework import serializers

from apps.catalogo.models import Actividad, Alojamiento, Complemento, Destino


class DestinoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destino
        fields = [
            "id", "nombre", "pais", "descripcion",
            "latitud", "longitud", "url_video",
            "imagenes", "estado", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        validated_data.setdefault("created_at", timezone.now())
        return super().create(validated_data)


class ActividadSerializer(serializers.ModelSerializer):
    destino_nombre = serializers.CharField(source="destino.nombre", read_only=True, allow_null=True)

    class Meta:
        model = Actividad
        fields = [
            "id", "nombre", "descripcion", "categoria",
            "duracion_horas", "localizacion", "proveedor",
            "imagenes", "horarios", "destino", "destino_nombre",
            "estado", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        validated_data.setdefault("created_at", timezone.now())
        return super().create(validated_data)


class AlojamientoSerializer(serializers.ModelSerializer):
    destino_nombre = serializers.CharField(source="destino.nombre", read_only=True, allow_null=True)

    class Meta:
        model = Alojamiento
        fields = [
            "id", "nombre", "tipo", "categoria_estrellas",
            "destino", "destino_nombre", "direccion",
            "telefono", "email_contacto", "imagenes",
            "estado", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        validated_data.setdefault("created_at", timezone.now())
        return super().create(validated_data)


class ComplementoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complemento
        fields = [
            "id", "nombre", "tipo", "descripcion",
            "proveedor", "documentos", "estado", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        validated_data.setdefault("created_at", timezone.now())
        return super().create(validated_data)
