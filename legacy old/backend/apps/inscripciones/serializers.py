from django.utils import timezone
from rest_framework import serializers

from apps.documentos.utils import calcular_estado_docs
from apps.inscripciones.models import Inscripcion
from apps.pagos.utils import calcular_estado_pago
from apps.viajes.models import Viaje


class DatosSaludSerializer(serializers.Serializer):
    alergias = serializers.CharField(required=False, allow_blank=True, default="")
    tratamientos = serializers.CharField(required=False, allow_blank=True, default="")
    dieta_especial = serializers.CharField(required=False, allow_blank=True, default="")
    movilidad_reducida = serializers.BooleanField(required=False, default=False)
    contacto_emergencia = serializers.JSONField(required=False, default=dict)

    def validate_contacto_emergencia(self, value):
        required_keys = {"nombre", "telefono", "relacion"}
        if not isinstance(value, dict):
            raise serializers.ValidationError("contacto_emergencia debe ser un objeto JSON.")
        if not value:
            return value
        missing = required_keys - set(value.keys())
        if missing:
            raise serializers.ValidationError(
                f"Faltan campos obligatorios en contacto_emergencia: {', '.join(sorted(missing))}."
            )
        return value


class InscripcionListSerializer(serializers.ModelSerializer):
    viajero_nombre = serializers.SerializerMethodField()
    viajero_email = serializers.SerializerMethodField()

    def get_viajero_nombre(self, obj):
        if obj.viajero:
            return obj.viajero.nombre or ""
        # Fallback a datos_salud para inscripciones manuales sin perfil
        if isinstance(obj.datos_salud, dict):
            return obj.datos_salud.get("nombre", "")
        return ""

    def get_viajero_email(self, obj):
        if obj.viajero:
            return obj.viajero.email or ""
        if isinstance(obj.datos_salud, dict):
            return obj.datos_salud.get("email", "")
        return ""
    viaje_nombre = serializers.CharField(source="viaje.nombre", read_only=True)
    pago_estado = serializers.SerializerMethodField()
    docs_estado = serializers.SerializerMethodField()
    documentos_estado = serializers.SerializerMethodField()

    class Meta:
        model = Inscripcion
        fields = [
            "id",
            "viajero",
            "viajero_nombre",
            "viajero_email",
            "viaje",
            "viaje_nombre",
            "estado",
            "pago_estado",
            "docs_estado",
            "documentos_estado",
            "tipo_habitacion",
            "created_at",
        ]

    def get_pago_estado(self, obj):
        return calcular_estado_pago(obj)

    def get_docs_estado(self, obj):
        return calcular_estado_docs(obj)

    def get_documentos_estado(self, obj):
        return self.get_docs_estado(obj)


class InscripcionDetailSerializer(serializers.ModelSerializer):
    datos_salud = DatosSaludSerializer(required=False)
    viajero_nombre = serializers.SerializerMethodField()
    viajero_email = serializers.SerializerMethodField()

    def get_viajero_nombre(self, obj):
        if obj.viajero:
            return obj.viajero.nombre or ""
        # Fallback a datos_salud para inscripciones manuales sin perfil
        if isinstance(obj.datos_salud, dict):
            return obj.datos_salud.get("nombre", "")
        return ""

    def get_viajero_email(self, obj):
        if obj.viajero:
            return obj.viajero.email or ""
        if isinstance(obj.datos_salud, dict):
            return obj.datos_salud.get("email", "")
        return ""
    viaje_nombre = serializers.CharField(source="viaje.nombre", read_only=True)

    class Meta:
        model = Inscripcion
        fields = [
            "id",
            "viajero",
            "viajero_nombre",
            "viajero_email",
            "viaje",
            "viaje_nombre",
            "tipo_habitacion",
            "estado",
            "datos_salud",
            "created_at",
        ]
        read_only_fields = ["id", "viaje", "created_at"]

    def create(self, validated_data):
        if "created_at" not in validated_data:
            validated_data["created_at"] = timezone.now()
        return super().create(validated_data)


class InscripcionPublicaSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(write_only=True)
    apellidos = serializers.CharField(write_only=True)
    dni = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    telefono = serializers.CharField(write_only=True, required=False, allow_blank=True)
    fecha_nacimiento = serializers.DateField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Inscripcion
        fields = [
            "nombre",
            "apellidos",
            "dni",
            "email",
            "telefono",
            "fecha_nacimiento",
            "tipo_habitacion",
            "datos_salud",
        ]

    def validate_tipo_habitacion(self, value):
        if not value:
            return value
        viaje = self.context.get("viaje")
        if not viaje or not isinstance(viaje, Viaje):
            return value

        # Flexibilidad para el MVP: No validar contra configuracion si no existe
        cfg = viaje.configuracion or {}
        tipos_habitacion = cfg.get("tipos_habitacion")
        if not tipos_habitacion:
            return value

        if value not in tipos_habitacion:
            opciones = ", ".join(tipos_habitacion)
            raise serializers.ValidationError(
                f"El tipo de habitación '{value}' no es válido para este viaje. Opciones: {opciones}"
            )
        return value

    def validate(self, attrs):
        viaje = self.context.get("viaje")
        if not viaje:
            raise serializers.ValidationError("No se encontró el viaje para la inscripción.")

        # Flexibilidad para el MVP: Si el viaje existe pero no está publicado, permitirlo para pruebas
        if viaje.estado != "publicado":
            print(f"DEBUG: El viaje {viaje.slug} tiene estado {viaje.estado}. Permitiendo inscripción para pruebas.")

        # Si ya existe, simplemente devolvemos los datos para que el flujo siga
        return attrs


class InscripcionResumenSerializer(serializers.ModelSerializer):
    viajero_nombre = serializers.SerializerMethodField()
    viajero_email = serializers.SerializerMethodField()

    def get_viajero_nombre(self, obj):
        if obj.viajero:
            return obj.viajero.nombre or ""
        # Fallback a datos_salud para inscripciones manuales sin perfil
        if isinstance(obj.datos_salud, dict):
            return obj.datos_salud.get("nombre", "")
        return ""

    def get_viajero_email(self, obj):
        if obj.viajero:
            return obj.viajero.email or ""
        if isinstance(obj.datos_salud, dict):
            return obj.datos_salud.get("email", "")
        return ""
    viaje_nombre = serializers.CharField(source="viaje.nombre", read_only=True)
    pago_estado = serializers.SerializerMethodField()
    docs_estado = serializers.SerializerMethodField()
    documentos_estado = serializers.SerializerMethodField()
    datos_salud_completitud = serializers.SerializerMethodField()

    class Meta:
        model = Inscripcion
        fields = [
            "id",
            "estado",
            "viajero",
            "viajero_nombre",
            "viajero_email",
            "viaje",
            "viaje_nombre",
            "tipo_habitacion",
            "created_at",
            "pago_estado",
            "docs_estado",
            "documentos_estado",
            "datos_salud_completitud",
        ]

    @staticmethod
    def _completion_ratio(data, required_fields):
        if not isinstance(data, dict) or not required_fields:
            return 0
        completed = sum(1 for key in required_fields if data.get(key))
        return int((completed / len(required_fields)) * 100)

    def get_pago_estado(self, obj):
        return calcular_estado_pago(obj)

    def get_docs_estado(self, obj):
        return calcular_estado_docs(obj)

    def get_documentos_estado(self, obj):
        return self.get_docs_estado(obj)

    def get_datos_salud_completitud(self, obj):
        datos_salud = obj.datos_salud if isinstance(obj.datos_salud, dict) else {}
        if not datos_salud:
            return 0
        contacto = datos_salud.get("contacto_emergencia") if isinstance(datos_salud.get("contacto_emergencia"), dict) else {}
        score_contacto = self._completion_ratio(contacto, ["nombre", "telefono", "relacion"])
        flags = [datos_salud.get("alergias"), datos_salud.get("tratamientos"), datos_salud.get("dieta_especial")]
        score_text = int((sum(1 for item in flags if item) / 3) * 100) if flags else 0
        return int((score_contacto * 0.6) + (score_text * 0.4))
