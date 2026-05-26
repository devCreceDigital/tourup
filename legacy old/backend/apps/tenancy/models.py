import uuid

from django.db import models


class Tenant(models.Model):
    STATUS_ACTIVE = "activo"
    STATUS_INACTIVE = "cancelado"
    STATUS_SUSPENDED = "suspendido"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Activo"),
        (STATUS_INACTIVE, "Inactivo"),
        (STATUS_SUSPENDED, "Suspendido"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255)
    dominio = models.CharField(max_length=255, unique=True)
    plan_id = models.UUIDField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "tenants"

    def __str__(self):
        return f"{self.nombre} ({self.dominio})"


class TenantConfig(models.Model):
    STEP_EMPRESA        = 1
    STEP_BRANDING       = 2
    STEP_PRIMER_VIAJE   = 3
    STEP_PRIMER_USUARIO = 4
    STEP_COMPLETADO     = 5

    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id               = models.UUIDField(unique=True, db_index=True)
    logo_url                = models.CharField(max_length=500, null=True, blank=True)
    color_primario          = models.CharField(max_length=7, default="#1D9E75")
    color_secundario        = models.CharField(max_length=7, default="#1a1a2e")
    descripcion             = models.TextField(blank=True, default="")
    website                 = models.CharField(max_length=255, blank=True, default="")
    telefono                = models.CharField(max_length=30, blank=True, default="")
    ruc                     = models.CharField(max_length=20, blank=True, default="")
    banner_url              = models.CharField(max_length=500, null=True, blank=True)
    slogan                  = models.CharField(max_length=300, blank=True, default="")
    dominio_custom          = models.CharField(max_length=255, blank=True, null=True)
    redes_sociales          = models.JSONField(default=dict, blank=True)
    preferencias            = models.JSONField(default=dict, blank=True)
    onboarding_step         = models.IntegerField(default=STEP_EMPRESA)
    onboarding_completado   = models.BooleanField(default=False)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        managed  = True
        db_table = "tenant_config"

    def __str__(self):
        return f"Config tenant={self.tenant_id} step={self.onboarding_step}"
