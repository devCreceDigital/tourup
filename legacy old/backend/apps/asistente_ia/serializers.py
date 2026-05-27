from rest_framework import serializers

from apps.viajes.models import Viaje

from .models import AsistenteIaSession, AsistenteIaLead


class AsistenteIaSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsistenteIaSession
        fields = [
            'id', 'session_token', 'messages', 'intent_data', 
            'language', 'status', 'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'expires_at']


class AsistenteIaLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsistenteIaLead
        fields = [
            'id', 'company_id', 'session', 'traveler_name', 
            'traveler_email', 'traveler_msg', 'intent_data',
            'matched_trip_id', 'match_score', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CreateSessionSerializer(serializers.Serializer):
    language = serializers.ChoiceField(
        choices=['es', 'en', 'pt'],
        default='es',
        required=False
    )
    user_name = serializers.CharField(max_length=100, required=False, allow_blank=True)


class SendMessageSerializer(serializers.Serializer):
    session_token = serializers.RegexField(regex=r"^[a-f0-9]{64}$")
    content = serializers.CharField(max_length=1000, trim_whitespace=True)


class CreateLeadSerializer(serializers.Serializer):
    session_token = serializers.RegexField(regex=r"^[a-f0-9]{64}$")
    company_id = serializers.UUIDField()
    trip_id = serializers.UUIDField()
    match_score = serializers.FloatField(min_value=0.0, max_value=1.0)
    traveler_name = serializers.CharField(max_length=255)
    traveler_email = serializers.EmailField()
    traveler_msg = serializers.CharField(required=False, allow_blank=True, max_length=500)


class LeadStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['new', 'contacted', 'converted', 'closed']
    )


class AgencyLeadListSerializer(serializers.ModelSerializer):
    trip_name = serializers.SerializerMethodField()

    class Meta:
        model = AsistenteIaLead
        fields = [
            "id",
            "traveler_name",
            "traveler_email",
            "intent_data",
            "trip_name",
            "match_score",
            "status",
            "created_at",
        ]

    def get_trip_name(self, obj):
        if not obj.matched_trip_id:
            return "Viaje no especificado"
        try:
            return (
                Viaje.objects.filter(id=obj.matched_trip_id)
                .values_list("nombre", flat=True)
                .first()
                or "Viaje no disponible"
            )
        except Exception:
            return "Viaje no disponible"


class AgencyLeadDetailSerializer(serializers.ModelSerializer):
    trip_name = serializers.SerializerMethodField()

    class Meta:
        model = AsistenteIaLead
        fields = [
            "id",
            "company_id",
            "session",
            "traveler_name",
            "traveler_email",
            "traveler_msg",
            "intent_data",
            "matched_trip_id",
            "trip_name",
            "match_score",
            "status",
            "created_at",
        ]

    def get_trip_name(self, obj):
        if not obj.matched_trip_id:
            return "Viaje no especificado"
        try:
            return (
                Viaje.objects.filter(id=obj.matched_trip_id)
                .values_list("nombre", flat=True)
                .first()
                or "Viaje no disponible"
            )
        except Exception:
            return "Viaje no disponible"
