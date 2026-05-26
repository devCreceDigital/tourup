from rest_framework import serializers

from apps.usuarios.models import Perfil


class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ["id", "email", "nombre", "rol", "tenant_id", "created_at"]
        read_only_fields = ["id", "created_at"]
