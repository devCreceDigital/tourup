import uuid
from django.db import models


class AsistenteIaSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_token = models.CharField(max_length=64, unique=True, db_index=True)
    messages = models.JSONField(default=list, blank=True)
    intent_data = models.JSONField(null=True, blank=True)
    language = models.CharField(max_length=5, default='es')
    status = models.CharField(
        max_length=20,
        default='active',
        choices=[
            ('active', 'Active'),
            ('completed', 'Completed'),
            ('expired', 'Expired')
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'asistente_ia_sessions'

    def __str__(self):
        return f"Session {self.session_token[:8]}..."


class AsistenteIaLead(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_id = models.UUIDField(db_column="tenant_id")
    session = models.ForeignKey(
        AsistenteIaSession,
        on_delete=models.CASCADE,
        related_name='leads'
    )
    traveler_name = models.CharField(max_length=255)
    traveler_email = models.EmailField()
    traveler_msg = models.TextField(blank=True, null=True)
    intent_data = models.JSONField()
    matched_trip_id = models.UUIDField(null=True, blank=True)
    match_score = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        default='new',
        choices=[
            ('new', 'New'),
            ('contacted', 'Contacted'),
            ('converted', 'Converted'),
            ('closed', 'Closed')
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'asistente_ia_leads'
        indexes = [
            models.Index(fields=['company_id']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Lead {self.traveler_name} - {self.status}"


class AsistenteIaEmbeddingsLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entity_type = models.CharField(
        max_length=20,
        choices=[
            ('itinerario', 'Itinerario'),
            ('viaje', 'Viaje')
        ]
    )
    entity_id = models.UUIDField()
    model_used = models.CharField(max_length=60)
    dims = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'asistente_ia_embeddings_log'

    def __str__(self):
        return f"Embedding {self.entity_type} {self.entity_id[:8]}..."

class AsistenteTripPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        AsistenteIaSession,
        on_delete=models.CASCADE,
        related_name='trip_plans',
        null=True, blank=True
    )
    share_token = models.CharField(max_length=32, unique=True, db_index=True)
    title = models.CharField(max_length=255, default='Mi viaje a Perú')
    destination = models.CharField(max_length=500, blank=True)
    days = models.IntegerField(default=0)
    travelers = models.IntegerField(default=1)
    itinerary = models.JSONField(default=list)
    budget = models.JSONField(null=True, blank=True)
    weather = models.JSONField(null=True, blank=True)
    hotels = models.JSONField(default=list)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'asistente_ia_trip_plans'

    def __str__(self):
        return f"Trip {self.title} - {self.destination}"
