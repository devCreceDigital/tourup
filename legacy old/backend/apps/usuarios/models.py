import secrets
import uuid
from django.db import models
from django.utils import timezone


class Perfil(models.Model):
    """
    Espejo del registro auth.users de Supabase.
    managed=False: la tabla 'perfiles' vive en Supabase, Django solo la lee/escribe.
    Se crea automáticamente vía trigger de Supabase al registrar un usuario.
    """
    ROLES = [
        ("superadmin", "Superadmin"),
        ("admin", "Admin"),
        ("usuario", "Usuario"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(null=True, blank=True)
    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=255, blank=True, default="")
    rol = models.CharField(max_length=50, choices=ROLES, default="usuario")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "perfiles"

    def __str__(self):
        return f"{self.nombre} <{self.email}> [{self.rol}]"


class InvitacionUsuario(models.Model):
    ESTADO_PENDIENTE = "pendiente"
    ESTADO_ACEPTADA  = "aceptada"
    ESTADO_EXPIRADA  = "expirada"

    ESTADOS = [
        (ESTADO_PENDIENTE, "Pendiente"),
        (ESTADO_ACEPTADA,  "Aceptada"),
        (ESTADO_EXPIRADA,  "Expirada"),
    ]

    ROLES = [
        ("admin",   "Admin"),
        ("usuario", "Usuario"),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id   = models.UUIDField()
    email       = models.EmailField()
    rol         = models.CharField(max_length=50, choices=ROLES, default="usuario")
    token       = models.CharField(max_length=64, unique=True)
    status      = models.CharField(max_length=20, choices=ESTADOS, default=ESTADO_PENDIENTE)
    created_by  = models.UUIDField(null=True, blank=True)
    expires_at  = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = True
        db_table = "invitaciones_usuario"
        unique_together = [("tenant_id", "email")]

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(48)
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invitación a {self.email} [{self.status}]"
