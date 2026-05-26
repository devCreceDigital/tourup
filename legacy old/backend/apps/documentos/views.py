from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.documentos.models import DocumentoViajero
from apps.documentos.serializers import DocumentoCreateSerializer, DocumentoListSerializer
from apps.inscripciones.models import Inscripcion
from apps.usuarios.models import Perfil


def _request_query_params(request):
    return getattr(request, "query_params", None) or getattr(request, "GET", {})


def _get_perfil_from_request(request):
    if request.user and request.user.is_authenticated:
        email = getattr(request.user, "email", None)
        if email:
            perfil = Perfil.objects.filter(email=email).first()
            if perfil:
                return perfil
    perfil_id = _request_query_params(request).get("perfil_id")
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


class DocumentosRolePermission(BasePermission):
    message = "No tienes permisos para esta acción."

    def has_permission(self, request, view):
        role = _current_role(request)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return role in {"admin", "superadmin", "profesor", "alumno"}
        return role in {"admin", "superadmin", "alumno"}

    def has_object_permission(self, request, _view, obj):
        role = _current_role(request)
        if role in {"admin", "superadmin", "profesor"}:
            return True
        if role == "alumno":
            perfil = _get_perfil_from_request(request)
            return bool(perfil and obj.inscripcion.viajero_id == perfil.id)
        return False


class DocumentosPorInscripcionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, DocumentosRolePermission]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return DocumentoCreateSerializer
        return DocumentoListSerializer

    def get_queryset(self):
        qs = DocumentoViajero.objects.select_related("inscripcion").filter(
            inscripcion_id=self.kwargs["inscripcion_id"]
        ).order_by("-created_at")
        if _current_role(self.request) == "alumno":
            perfil = _get_perfil_from_request(self.request)
            if not perfil:
                return DocumentoViajero.objects.none()
            qs = qs.filter(inscripcion__viajero=perfil)
        return qs

    def create(self, request, *args, **kwargs):
        role = _current_role(request)
        if role not in {"admin", "alumno"}:
            raise PermissionDenied("No tienes permisos para subir documentos.")

        inscripcion = get_object_or_404(Inscripcion, id=kwargs["inscripcion_id"])
        if role == "alumno":
            perfil = _get_perfil_from_request(request)
            if not perfil or inscripcion.viajero_id != perfil.id:
                raise PermissionDenied("Solo puedes subir documentos de tu propia inscripción.")

        serializer = self.get_serializer(data=request.data, context={"inscripcion": inscripcion})
        serializer.is_valid(raise_exception=True)
        documento = serializer.save()
        return Response(DocumentoListSerializer(documento).data, status=status.HTTP_201_CREATED)


class DocumentoDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, DocumentosRolePermission]
    serializer_class = DocumentoListSerializer
    queryset = DocumentoViajero.objects.select_related("inscripcion")


class DocumentoAprobarView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, DocumentosRolePermission]
    serializer_class = DocumentoListSerializer

    def post(self, request, pk):
        if _current_role(request) != "admin":
            raise PermissionDenied("Solo admin puede aprobar documentos.")

        documento = get_object_or_404(DocumentoViajero, id=pk)
        documento.estado = DocumentoViajero.ESTADO_APROBADO
        documento.motivo_rechazo = ""
        documento.fecha_revision = timezone.now()
        documento.save(update_fields=["estado", "motivo_rechazo", "fecha_revision"])
        return Response(DocumentoListSerializer(documento).data, status=status.HTTP_200_OK)


class DocumentoRechazarView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, DocumentosRolePermission]
    serializer_class = DocumentoListSerializer

    def post(self, request, pk):
        if _current_role(request) != "admin":
            raise PermissionDenied("Solo admin puede rechazar documentos.")

        motivo = (request.data.get("motivo_rechazo") or "").strip()
        if not motivo:
            return Response(
                {"motivo_rechazo": ["motivo_rechazo es obligatorio para rechazar."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        documento = get_object_or_404(DocumentoViajero, id=pk)
        documento.estado = DocumentoViajero.ESTADO_RECHAZADO
        documento.motivo_rechazo = motivo
        documento.fecha_revision = timezone.now()
        documento.save(update_fields=["estado", "motivo_rechazo", "fecha_revision"])
        return Response(DocumentoListSerializer(documento).data, status=status.HTTP_200_OK)
