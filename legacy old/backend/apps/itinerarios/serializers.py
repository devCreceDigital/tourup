from django.utils import timezone
from rest_framework import serializers

from apps.itinerarios.models import DiaItinerario, EventoItinerario, Itinerario


class EventoItinerarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoItinerario
        fields = [
            "id", "tipo", "descripcion",
            "hora_inicio", "hora_fin", "actividad_id", "orden",
        ]
        read_only_fields = ["id"]


class DiaItinerarioSerializer(serializers.ModelSerializer):
    eventos = EventoItinerarioSerializer(many=True, read_only=True)

    class Meta:
        model = DiaItinerario
        fields = [
            "id", "numero_dia", "titulo", "resumen",
            "alojamiento_pernocta", "destino_nombre", "eventos",
        ]
        read_only_fields = ["id"]


class ItinerarioListSerializer(serializers.ModelSerializer):
    total_dias = serializers.SerializerMethodField()

    class Meta:
        model = Itinerario
        fields = ["id", "nombre", "descripcion", "version", "estado", "total_dias", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_total_dias(self, obj):
        return obj.dias.count()


class ItinerarioDetailSerializer(serializers.ModelSerializer):
    dias = DiaItinerarioSerializer(many=True, read_only=True)

    class Meta:
        model = Itinerario
        fields = ["id", "nombre", "descripcion", "version", "estado", "dias", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        validated_data.setdefault("created_at", timezone.now())
        return super().create(validated_data)
