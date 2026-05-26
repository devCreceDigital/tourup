from django.contrib import admin

from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display  = ["created_at", "evento", "user_email", "role", "tenant_id", "ip", "entidad_tipo", "entidad_id"]
    list_filter   = ["evento", "role", "created_at"]
    search_fields = ["user_email", "ip", "entidad_id", "entidad_tipo"]
    ordering      = ["-created_at"]
    date_hierarchy = "created_at"
    readonly_fields = [
        "id", "user_id", "user_email", "tenant_id", "role",
        "evento", "entidad_tipo", "entidad_id", "payload",
        "ip", "user_agent", "created_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        role = getattr(getattr(request, "user", None), "rol", "")
        if role != "superadmin":
            return qs.none()
        return qs
