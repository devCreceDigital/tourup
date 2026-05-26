from rest_framework import serializers
from django.utils import timezone
from apps.documentos.models import DocumentoViajero


class DocumentoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoViajero
        fields = [
            "id",
            "nombre",
            "tipo",
            "url",
            "obligatorio",
            "estado",
            "motivo_rechazo",
            "fecha_revision",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "estado", "motivo_rechazo", "fecha_revision", "created_at"]


class DocumentoCreateSerializer(serializers.ModelSerializer):
    url_archivo = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = DocumentoViajero
        fields = ["nombre", "tipo", "url", "url_archivo", "obligatorio", "metadata"]

    def create(self, validated_data):
        inscripcion = self.context["inscripcion"]
        url_archivo = validated_data.pop("url_archivo", None)
        if url_archivo:
            validated_data["url"] = url_archivo
        if "estado" not in validated_data:
            validated_data["estado"] = DocumentoViajero.ESTADO_EN_REVISION
        return DocumentoViajero.objects.create(inscripcion=inscripcion, created_at=timezone.now(), **validated_data)
