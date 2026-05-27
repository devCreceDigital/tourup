import uuid
from django.db import models


class AuditLog(models.Model):
    EVENTO_LOGIN               = "login"
    EVENTO_LOGOUT              = "logout"
    EVENTO_CAMBIO_ESTADO       = "cambio_estado"
    EVENTO_PAGO_MANUAL         = "pago_manual"
    EVENTO_ACCION_ADMIN        = "accion_admin"
    EVENTO_CAMBIO_PERMISO      = "cambio_permiso"
    EVENTO_SUSPENSION_TENANT   = "suspension_tenant"
    EVENTO_UPLOAD              = "upload"
    EVENTO_ACCESO_DENEGADO     = "acceso_denegado"
    EVENTO_CAMBIO_ROL          = "cambio_rol"
    EVENTO_INSCRIPCION         = "inscripcion"

    EVENTOS = [
        (EVENTO_LOGIN,             "Login"),
        (EVENTO_LOGOUT,            "Logout"),
        (EVENTO_CAMBIO_ESTADO,     "Cambio de estado"),
        (EVENTO_PAGO_MANUAL,       "Pago manual"),
        (EVENTO_ACCION_ADMIN,      "Acción admin"),
        (EVENTO_CAMBIO_PERMISO,    "Cambio de permiso"),
        (EVENTO_SUSPENSION_TENANT, "Suspensión de tenant"),
        (EVENTO_UPLOAD,            "Upload de archivo"),
        (EVENTO_ACCESO_DENEGADO,   "Acceso denegado"),
        (EVENTO_CAMBIO_ROL,        "Cambio de rol"),
        (EVENTO_INSCRIPCION,       "Inscripción"),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id      = models.UUIDField(null=True, blank=True, db_index=True)
    user_email   = models.EmailField(null=True, blank=True)
    tenant_id    = models.UUIDField(null=True, blank=True, db_index=True)
    role         = models.CharField(max_length=50, blank=True)
    evento       = models.CharField(max_length=50, choices=EVENTOS, db_index=True)
    entidad_tipo = models.CharField(max_length=100, blank=True)
    entidad_id   = models.CharField(max_length=100, blank=True)
    payload      = models.JSONField(default=dict, blank=True)
    ip           = models.GenericIPAddressField(null=True, blank=True)
    user_agent   = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table        = "audit_logs"
        ordering        = ["-created_at"]
        verbose_name    = "Audit Log"
        verbose_name_plural = "Audit Logs"

    def save(self, *args, **kwargs):
        if self.pk and AuditLog.objects.filter(pk=self.pk).exists():
            raise ValueError("AuditLog es inmutable: no se puede modificar un registro existente.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("AuditLog es inmutable: no se puede eliminar.")

    def __str__(self):
        return f"[{self.created_at}] {self.evento} — {self.user_email or self.user_id}"
