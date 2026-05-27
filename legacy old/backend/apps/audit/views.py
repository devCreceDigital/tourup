from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer

from apps.audit.models import AuditLog


class AuditLogSerializer(ModelSerializer):
    class Meta:
        model  = AuditLog
        fields = "__all__"


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/audit/logs/
    Solo superadmin puede consultar. Filtros: evento, tenant_id, user_email, desde, hasta.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = AuditLogSerializer

    def get_queryset(self):
        role = getattr(getattr(self.request, "user", None), "rol", "")
        if role != "superadmin":
            raise PermissionDenied("Solo superadmin puede consultar los audit logs.")

        qs = AuditLog.objects.all()
        p  = self.request.query_params

        if evento := p.get("evento"):
            qs = qs.filter(evento=evento)
        if tenant_id := p.get("tenant_id"):
            qs = qs.filter(tenant_id=tenant_id)
        if user_email := p.get("user_email"):
            qs = qs.filter(user_email__icontains=user_email)
        if desde := p.get("desde"):
            qs = qs.filter(created_at__gte=desde)
        if hasta := p.get("hasta"):
            qs = qs.filter(created_at__lte=hasta)

        return qs.order_by("-created_at")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(AuditLogSerializer(page, many=True).data)
        return Response({"count": qs.count(), "results": AuditLogSerializer(qs, many=True).data})
