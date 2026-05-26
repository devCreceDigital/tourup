from django.utils import timezone
from rest_framework import serializers

from apps.usuarios.models import Perfil
from apps.viajes.models import Viaje


class ViajeSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="estado", required=False)
    cupo_maximo = serializers.IntegerField(source="cupos", required=False, allow_null=True)
    responsable = serializers.SerializerMethodField()
    precio_base = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True)
    descripcion_corta = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Viaje
        fields = [
            "id",
            "tenant_id",
            "nombre",
            "codigo",
            "slug",
            "estado",
            "status",
            "fecha_inicio",
            "fecha_fin",
            "cupos",
            "cupo_maximo",
            "moneda",
            "itinerario_id",
            "responsable",
            "configuracion",
            "precio_base",
            "descripcion_corta",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_responsable(self, obj):
        cfg = obj.configuracion if isinstance(obj.configuracion, dict) else {}
        value = cfg.get("responsable")
        return value if isinstance(value, str) else ""

    @staticmethod
    def _get_perfil_from_request(request):
        if not request or not getattr(request, "user", None) or not getattr(request.user, "is_authenticated", False):
            return None
        email = getattr(request.user, "email", None)
        if not email:
            return None
        return Perfil.objects.filter(email=email).first()

    def validate(self, attrs):
        request = self.context.get("request")

        # 1. Asegurar fechas coherentes
        if "fecha_inicio" in attrs and not attrs.get("fecha_fin"):
            attrs["fecha_fin"] = attrs["fecha_inicio"]

        if request and request.method == "POST":
            if not attrs.get("fecha_inicio"):
                attrs["fecha_inicio"] = timezone.now().date()
            if not attrs.get("fecha_fin"):
                attrs["fecha_fin"] = attrs["fecha_inicio"]

        # 2. Validaciones de unicidad por tenant
        perfil = self._get_perfil_from_request(request)
        if not perfil or not getattr(perfil, "tenant_id", None):
            return attrs

        slug = attrs.get("slug") or getattr(self.instance, "slug", None)
        codigo = attrs.get("codigo") or getattr(self.instance, "codigo", None)

        qs = Viaje.objects.filter(tenant_id=perfil.tenant_id)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        if slug and qs.filter(slug=slug).exists():
            raise serializers.ValidationError({"slug": ["Ya existe un viaje con este slug en el tenant."]})
        if codigo and qs.filter(codigo=codigo).exists():
            raise serializers.ValidationError({"codigo": ["Ya existe un viaje con este código en el tenant."]})

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        perfil = self._get_perfil_from_request(request)

        precio_base = validated_data.pop("precio_base", None)
        descripcion_corta = validated_data.pop("descripcion_corta", None)

        instance = Viaje(**validated_data)

        if perfil and getattr(perfil, "tenant_id", None):
            instance.tenant_id = perfil.tenant_id

        if not getattr(instance, "created_at", None):
            instance.created_at = timezone.now()

        # Mezclar campos extra en JSON configuracion
        cfg = instance.configuracion if isinstance(instance.configuracion, dict) else {}
        if precio_base is not None:
            cfg["precio_base"] = float(precio_base)
        if descripcion_corta is not None:
            cfg["descripcion_corta"] = descripcion_corta
        instance.configuracion = cfg

        instance.save()
        return instance

    def update(self, instance, validated_data):
        precio_base = validated_data.pop("precio_base", None)
        descripcion_corta = validated_data.pop("descripcion_corta", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Mezclar en configuracion
        cfg = instance.configuracion if isinstance(instance.configuracion, dict) else {}
        if precio_base is not None:
            cfg["precio_base"] = float(precio_base)
        if descripcion_corta is not None:
            cfg["descripcion_corta"] = descripcion_corta
        instance.configuracion = cfg

        instance.save()
        return instance
