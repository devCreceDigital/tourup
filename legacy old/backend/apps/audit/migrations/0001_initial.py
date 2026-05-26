import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id",           models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("user_id",      models.UUIDField(blank=True, db_index=True, null=True)),
                ("user_email",   models.EmailField(blank=True, max_length=254, null=True)),
                ("tenant_id",    models.UUIDField(blank=True, db_index=True, null=True)),
                ("role",         models.CharField(blank=True, max_length=50)),
                ("evento",       models.CharField(
                    choices=[
                        ("login",             "Login"),
                        ("logout",            "Logout"),
                        ("cambio_estado",     "Cambio de estado"),
                        ("pago_manual",       "Pago manual"),
                        ("accion_admin",      "Acción admin"),
                        ("cambio_permiso",    "Cambio de permiso"),
                        ("suspension_tenant", "Suspensión de tenant"),
                        ("upload",            "Upload de archivo"),
                        ("acceso_denegado",   "Acceso denegado"),
                        ("cambio_rol",        "Cambio de rol"),
                        ("inscripcion",       "Inscripción"),
                    ],
                    db_index=True,
                    max_length=50,
                )),
                ("entidad_tipo", models.CharField(blank=True, max_length=100)),
                ("entidad_id",   models.CharField(blank=True, max_length=100)),
                ("payload",      models.JSONField(blank=True, default=dict)),
                ("ip",           models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent",   models.TextField(blank=True)),
                ("created_at",   models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "verbose_name":        "Audit Log",
                "verbose_name_plural": "Audit Logs",
                "db_table":            "audit_logs",
                "ordering":            ["-created_at"],
            },
        ),
    ]
