from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.inscripciones.models import Inscripcion
from apps.pagos.models import Cuota, Pago
from apps.pagos.serializers import CuotaSerializer, PagoListSerializer, PagoManualSerializer
from apps.usuarios.models import Perfil


def _get_perfil_from_request(request):
    if request.user and request.user.is_authenticated:
        email = getattr(request.user, "email", None)
        if email:
            perfil = Perfil.objects.filter(email=email).first()
            if perfil:
                return perfil
    perfil_id = request.query_params.get("perfil_id")
    if perfil_id:
        return Perfil.objects.filter(id=perfil_id).first()
    return None


def _current_role(request):
    user_role = (getattr(getattr(request, "user", None), "rol", "") or "").lower()
    if user_role == "superadmin":
        return "superadmin"
    if user_role == "admin":
        return "admin"
    if user_role in {"staff", "profesor"}:
        return "profesor"
    if user_role in {"user", "usuario", "alumno", "viajero"}:
        return "alumno"

    raw = (getattr(_get_perfil_from_request(request), "rol", "") or "").lower()
    if raw == "superadmin":
        return "superadmin"
    if raw == "admin":
        return "admin"
    if raw == "profesor":
        return "profesor"
    return "alumno"


def _current_tenant_id(request):
    perfil = _get_perfil_from_request(request)
    return getattr(perfil, "tenant_id", None) if perfil else None


class PagosRolePermission(BasePermission):
    message = "No tienes permisos para esta acción."

    def has_permission(self, request, view):
        role = _current_role(request)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return role in {"admin", "superadmin", "profesor", "alumno"}
        return role in {"admin", "superadmin"}

    def has_object_permission(self, request, _view, obj):
        role = _current_role(request)
        if role in {"admin", "superadmin", "profesor"}:
            return True
        if role == "alumno":
            perfil = _get_perfil_from_request(request)
            return bool(perfil and obj.inscripcion.viajero_id == perfil.id)
        return False


class PagosPorInscripcionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, PagosRolePermission]
    serializer_class = PagoListSerializer

    def get_queryset(self):
        qs = Pago.objects.select_related("inscripcion", "cuota").filter(
            inscripcion_id=self.kwargs["inscripcion_id"]
        ).order_by("-created_at")
        tenant_id = _current_tenant_id(self.request)
        if tenant_id:
            qs = qs.filter(inscripcion__viaje__tenant_id=tenant_id)
        if _current_role(self.request) == "alumno":
            perfil = _get_perfil_from_request(self.request)
            if not perfil:
                return Pago.objects.none()
            qs = qs.filter(inscripcion__viajero=perfil)
        return qs


class PagosListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, PagosRolePermission]
    serializer_class = PagoListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["estado", "metodo"]
    search_fields = [
        "inscripcion__viajero__nombre",
        "inscripcion__viajero__email",
        "inscripcion__viaje__nombre",
        "referencia",
    ]
    ordering_fields = ["created_at", "monto", "estado"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Pago.objects.select_related("inscripcion__viajero", "inscripcion__viaje", "cuota").all()
        tenant_id = _current_tenant_id(self.request)
        if tenant_id:
            qs = qs.filter(inscripcion__viaje__tenant_id=tenant_id)
        role = _current_role(self.request)
        if role == "alumno":
            perfil = _get_perfil_from_request(self.request)
            if not perfil:
                return Pago.objects.none()
            qs = qs.filter(inscripcion__viajero=perfil)
        return qs


class PagoManualCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, PagosRolePermission]
    serializer_class = PagoManualSerializer

    def create(self, request, *args, **kwargs):
        if _current_role(request) != "admin":
            raise PermissionDenied("Solo admin puede registrar pagos manuales.")
        inscripcion = get_object_or_404(Inscripcion, id=kwargs["inscripcion_id"])
        serializer = self.get_serializer(data=request.data, context={"inscripcion": inscripcion})
        serializer.is_valid(raise_exception=True)
        pago = serializer.save()
        return Response(PagoListSerializer(pago).data, status=status.HTTP_201_CREATED)


class PagoDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, PagosRolePermission]
    serializer_class = PagoListSerializer
    queryset = Pago.objects.select_related("inscripcion", "cuota")


class CuotasPorViajeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, PagosRolePermission]
    serializer_class = CuotaSerializer

    def get_queryset(self):
        return Cuota.objects.filter(viaje_id=self.kwargs["viaje_id"])

    def perform_create(self, serializer):
        if _current_role(self.request) != "admin":
            raise PermissionDenied("Solo admin puede crear cuotas.")
        from apps.viajes.models import Viaje
        viaje = get_object_or_404(Viaje, pk=self.kwargs["viaje_id"])
        serializer.save(viaje=viaje)


class CuotaDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, PagosRolePermission]
    serializer_class = CuotaSerializer
    queryset = Cuota.objects.all()

    def destroy(self, request, *args, **kwargs):
        if _current_role(request) != "admin":
            raise PermissionDenied("Solo admin puede eliminar cuotas.")
        return super().destroy(request, *args, **kwargs)

class PagoUpdateEstadoView(generics.UpdateAPIView):
    """PATCH /api/pagos/{pk}/estado/ — verificar o rechazar un pago."""
    permission_classes = [IsAuthenticated, PagosRolePermission]
    serializer_class = PagoListSerializer
    queryset = Pago.objects.all()
    http_method_names = ["patch", "options"]

    def patch(self, request, *args, **kwargs):
        role = _current_role(request)
        if role not in {"admin", "superadmin"}:
            from rest_framework.response import Response
            from rest_framework import status
            return Response({"detail": "Solo admin puede verificar pagos."}, status=status.HTTP_403_FORBIDDEN)
        pago = self.get_object()
        nuevo_estado = request.data.get("estado")
        if nuevo_estado not in {"verificado", "rechazado", "pendiente"}:
            from rest_framework.response import Response
            from rest_framework import status
            return Response({"detail": "Estado invalido. Usa: verificado, rechazado, pendiente."}, status=status.HTTP_400_BAD_REQUEST)
        pago.estado = nuevo_estado
        pago.save(update_fields=["estado"])
        serializer = self.get_serializer(pago)
        from rest_framework.response import Response
        return Response(serializer.data)
