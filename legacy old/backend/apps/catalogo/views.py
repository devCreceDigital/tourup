from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import BasePermission, IsAuthenticated

from apps.catalogo.models import Actividad, Alojamiento, Complemento, Destino
from apps.catalogo.serializers import (
    ActividadSerializer,
    AlojamientoSerializer,
    ComplementoSerializer,
    DestinoSerializer,
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


class CatalogoRolePermission(BasePermission):
    message = "No tienes permisos para esta acción."

    def has_permission(self, request, view):
        role = _current_role(request)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return role in {"admin", "superadmin"}


class DestinoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CatalogoRolePermission]
    serializer_class = DestinoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["pais", "estado"]
    search_fields = ["nombre", "pais", "descripcion"]
    ordering_fields = ["nombre", "pais", "created_at"]
    ordering = ["nombre"]

    def get_queryset(self):
        return Destino.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_at=timezone.now())


class ActividadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CatalogoRolePermission]
    serializer_class = ActividadSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["categoria", "estado", "destino"]
    search_fields = ["nombre", "descripcion", "proveedor"]
    ordering_fields = ["nombre", "categoria", "created_at"]
    ordering = ["nombre"]

    def get_queryset(self):
        return Actividad.objects.select_related("destino").all()

    def perform_create(self, serializer):
        serializer.save(created_at=timezone.now())


class AlojamientoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CatalogoRolePermission]
    serializer_class = AlojamientoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["tipo", "estado", "destino"]
    search_fields = ["nombre", "direccion"]
    ordering_fields = ["nombre", "tipo", "created_at"]
    ordering = ["nombre"]

    def get_queryset(self):
        return Alojamiento.objects.select_related("destino").all()

    def perform_create(self, serializer):
        serializer.save(created_at=timezone.now())


class ComplementoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CatalogoRolePermission]
    serializer_class = ComplementoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["tipo", "estado"]
    search_fields = ["nombre", "descripcion", "proveedor"]
    ordering_fields = ["nombre", "tipo", "created_at"]
    ordering = ["nombre"]

    def get_queryset(self):
        return Complemento.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_at=timezone.now())
