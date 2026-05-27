from django.utils import timezone
from rest_framework import serializers

from apps.planes.models import Plan
from apps.tenancy.models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "nombre", "dominio", "plan_id", "status", "created_at"]
        read_only_fields = ["id", "created_at"]

    @staticmethod
    def _normalize_domain(value: str) -> str:
        domain = value.strip().lower()
        if domain.startswith("http://") or domain.startswith("https://"):
            raise serializers.ValidationError("domain debe ser solo host/subdominio, sin protocolo.")
        if "/" in domain:
            raise serializers.ValidationError("domain no debe contener rutas.")
        return domain

    def validate_dominio(self, value: str) -> str:
        dominio = self._normalize_domain(value)
        queryset = Tenant.objects.filter(dominio=domain)
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
        if queryset.exists():
            raise serializers.ValidationError("Ya existe un tenant con este dominio.")
        return domain

    def validate_plan_id(self, value):
        if value in (None, ""):
            return None
        if not Plan.objects.filter(id=value).exists():
            raise serializers.ValidationError("El plan seleccionado no existe.")
        return value

    def create(self, validated_data):
        tenant = Tenant(**validated_data)
        if not getattr(tenant, "created_at", None):
            tenant.created_at = timezone.now()
        tenant.save()
        return tenant
