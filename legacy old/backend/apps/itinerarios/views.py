from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.itinerarios.models import DiaItinerario, EventoItinerario, Itinerario
from apps.itinerarios.serializers import (
    DiaItinerarioSerializer,
    EventoItinerarioSerializer,
    ItinerarioDetailSerializer,
    ItinerarioListSerializer,
)
from apps.usuarios.models import Perfil


def _get_perfil(request):
    if request.user and request.user.is_authenticated:
        email = getattr(request.user, "email", None)
        if email:
            return Perfil.objects.filter(email=email).first()
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

    raw = (getattr(_get_perfil(request), "rol", "") or "").lower()
    if raw == "superadmin":
        return "superadmin"
    if raw == "admin":
        return "admin"
    if raw == "profesor":
        return "profesor"
    return "alumno"


class ItinerariosRolePermission(BasePermission):
    message = "No tienes permisos para esta acción."

    def has_permission(self, request, view):
        role = _current_role(request)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return role in {"admin", "superadmin"}


class ItinerarioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, ItinerariosRolePermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["estado", "version"]
    search_fields = ["nombre", "descripcion"]
    ordering_fields = ["nombre", "version", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Itinerario.objects.prefetch_related("dias__eventos").all()

    def get_serializer_class(self):
        if self.action in {"retrieve"}:
            return ItinerarioDetailSerializer
        return ItinerarioListSerializer

    def perform_create(self, serializer):
        from apps.inscripciones.views import _current_tenant_id
        tenant_id = _current_tenant_id(self.request)
        serializer.save(created_at=timezone.now(), tenant_id=str(tenant_id) if tenant_id else None)

    @action(detail=True, methods=["post"], url_path="clonar")
    def clonar(self, request, pk=None):
        original = self.get_object()
        from apps.inscripciones.views import _current_tenant_id
        tenant_id = _current_tenant_id(request)
        clon = Itinerario.objects.create(
            nombre=f"{original.nombre} (copia)",
            descripcion=original.descripcion,
            version=original.version,
            estado="activo",
            tenant_id=str(tenant_id) if tenant_id else None,
            created_at=timezone.now(),
        )
        for dia in original.dias.prefetch_related("eventos").all():
            nuevo_dia = DiaItinerario.objects.create(
                itinerario=clon,
                numero_dia=dia.numero_dia,
                titulo=dia.titulo,
                resumen=dia.resumen,
                alojamiento_pernocta=dia.alojamiento_pernocta,
                destino_nombre=dia.destino_nombre,
            )
            for evento in dia.eventos.all():
                EventoItinerario.objects.create(
                    dia=nuevo_dia,
                    tipo=evento.tipo,
                    descripcion=evento.descripcion,
                    hora_inicio=evento.hora_inicio,
                    hora_fin=evento.hora_fin,
                    actividad_id=evento.actividad_id,
                    orden=evento.orden,
                )
        return Response(ItinerarioDetailSerializer(clon).data, status=status.HTTP_201_CREATED)


class DiasItinerarioListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, ItinerariosRolePermission]
    serializer_class = DiaItinerarioSerializer

    def get_queryset(self):
        return DiaItinerario.objects.prefetch_related("eventos").filter(
            itinerario_id=self.kwargs["itinerario_id"]
        )

    def perform_create(self, serializer):
        itinerario = get_object_or_404(Itinerario, id=self.kwargs["itinerario_id"])
        serializer.save(itinerario=itinerario)


class DiaItinerarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, ItinerariosRolePermission]
    serializer_class = DiaItinerarioSerializer

    def get_object(self):
        return get_object_or_404(
            DiaItinerario.objects.prefetch_related("eventos"),
            id=self.kwargs["dia_id"],
            itinerario_id=self.kwargs["itinerario_id"],
        )


class EventosListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, ItinerariosRolePermission]
    serializer_class = EventoItinerarioSerializer

    def get_queryset(self):
        return EventoItinerario.objects.filter(dia_id=self.kwargs["dia_id"])

    def perform_create(self, serializer):
        dia = get_object_or_404(DiaItinerario, id=self.kwargs["dia_id"])
        serializer.save(dia=dia)


class EventoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, ItinerariosRolePermission]
    serializer_class = EventoItinerarioSerializer

    def get_object(self):
        return get_object_or_404(
            EventoItinerario,
            id=self.kwargs["evento_id"],
            dia_id=self.kwargs["dia_id"],
        )
