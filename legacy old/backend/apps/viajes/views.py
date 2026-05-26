import uuid

from apps.planes.utils import check_trip_limit
from apps.usuarios.models import Perfil
from apps.viajes.models import Viaje
from apps.viajes.serializers import ViajeSerializer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response


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


def _current_tenant_id(request):
    perfil = _get_perfil_from_request(request)
    return getattr(perfil, "tenant_id", None) if perfil else None


class ViajesRolePermission(BasePermission):
    message = "No tienes permisos para esta acción."

    def has_permission(self, request, view):
        role = _current_role(request)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return role in {"admin", "superadmin", "profesor", "alumno"}
        if view.action == "publicar":
            return role in {"admin", "superadmin"}
        return role in {"admin", "superadmin"}


class PublicViajesListView(generics.ListAPIView):
    """Endpoint público: lista viajes en estado 'publicado', sin autenticación."""
    permission_classes = [AllowAny]
    serializer_class = ViajeSerializer

    def get_queryset(self):
        tenant_id = _request_query_params(self.request).get("tenant_id")
        qs = Viaje.objects.filter(estado="publicado")
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        return qs.order_by("-created_at")


class PublicViajeDetailView(generics.RetrieveAPIView):
    """Endpoint público: detalle de un viaje publicado por slug, sin autenticación."""
    permission_classes = [AllowAny]
    serializer_class = ViajeSerializer
    lookup_field = "slug"

    def get_queryset(self):
        tenant_id = _request_query_params(self.request).get("tenant_id")
        qs = Viaje.objects.filter(estado="publicado")
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        return qs


class ViajeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, ViajesRolePermission]
    serializer_class = ViajeSerializer
    queryset = Viaje.objects.all().order_by("-created_at")
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["estado"]
    search_fields = ["nombre", "slug", "codigo"]
    ordering_fields = ["created_at", "fecha_inicio", "estado", "nombre"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        tenant_id = _current_tenant_id(self.request)
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        return qs

    def perform_create(self, serializer):
        import random, string
        tenant_id = _current_tenant_id(self.request)
        if tenant_id:
            check_trip_limit(tenant_id)
        # Generar codigo de referencia: DST-YYYY-XXXX
        nombre = serializer.validated_data.get("nombre", "VIA")
        # Tomar primeras 3 letras del nombre sin espacios, en mayusculas
        prefix = "".join(c for c in nombre.upper() if c.isalpha())[:3].ljust(3, "X")
        year = timezone.now().year
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        codigo = f"{prefix}-{year}-{suffix}"
        serializer.save(
            tenant_id=tenant_id,
            codigo=codigo,
            created_at=timezone.now(),
        )

    @action(detail=True, methods=["post"], url_path="publicar")
    def publicar(self, request, pk=None):
        viaje = self.get_object()
        if viaje.estado == "publicado":
            return Response({"detail": "El viaje ya está publicado."}, status=status.HTTP_200_OK)
        viaje.estado = "publicado"
        viaje.save(update_fields=["estado"])
        return Response({"id": str(viaje.id), "estado": viaje.estado}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="despublicar")
    def despublicar(self, request, pk=None):
        viaje = self.get_object()
        if viaje.estado != "publicado":
            return Response({"detail": "El viaje no está publicado."}, status=status.HTTP_200_OK)
        viaje.estado = "borrador"
        viaje.save(update_fields=["estado"])
        return Response({"id": str(viaje.id), "estado": viaje.estado}, status=status.HTTP_200_OK)


class OperacionSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    viaje_id = serializers.CharField(required=False)
    viaje = serializers.CharField(required=False)
    titulo = serializers.CharField()
    tipo = serializers.ChoiceField(choices=["transporte", "alojamiento", "alimentacion", "actividad", "documentacion"])
    estado = serializers.ChoiceField(choices=["pendiente", "en_proceso", "completado", "atrasado"])
    fecha_inicio = serializers.DateField(required=False, allow_null=True)
    fecha_fin = serializers.DateField(required=False, allow_null=True)
    responsable = serializers.CharField()
    proveedor = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    prioridad = serializers.ChoiceField(choices=["alta", "media", "baja"])
    notas = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_at = serializers.DateTimeField(required=False, allow_null=True)
    updated_at = serializers.DateTimeField(required=False, allow_null=True)


class OperacionesRolePermission(BasePermission):
    message = "No tienes permisos para esta acción."

    def has_permission(self, request, _view):
        role = _current_role(request)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return role in {"admin", "profesor"}
        return role == "admin"


def _get_viaje_config(viaje: Viaje) -> dict:
    cfg = viaje.configuracion if isinstance(viaje.configuracion, dict) else {}
    return cfg


def _get_viaje_operaciones(viaje: Viaje) -> list:
    cfg = _get_viaje_config(viaje)
    ops = cfg.get("operaciones")
    return ops if isinstance(ops, list) else []


def _save_viaje_operaciones(viaje: Viaje, ops: list) -> None:
    cfg = _get_viaje_config(viaje)
    cfg["operaciones"] = ops
    viaje.configuracion = cfg
    viaje.save(update_fields=["configuracion"])


def _normalize_operacion_for_json(op: dict) -> dict:
    data = dict(op)
    for key in ("fecha_inicio", "fecha_fin"):
        val = data.get(key)
        if hasattr(val, "isoformat"):
            data[key] = val.isoformat()
    for key in ("created_at", "updated_at"):
        val = data.get(key)
        if hasattr(val, "isoformat"):
            data[key] = val.isoformat()
    return data


class OperacionesListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, OperacionesRolePermission]

    def get(self, request):
        qs = Viaje.objects.all().order_by("-created_at")
        query_params = _request_query_params(request)

        viaje_id = query_params.get("viaje_id")
        if viaje_id:
            qs = qs.filter(id=viaje_id)

        search = (query_params.get("search") or "").strip().lower()
        tipo = query_params.get("tipo") or ""
        estado = query_params.get("estado") or ""
        prioridad = query_params.get("prioridad") or ""
        responsable = (query_params.get("responsable") or "").strip().lower()

        items = []
        for viaje in qs:
            for op in _get_viaje_operaciones(viaje):
                if not isinstance(op, dict):
                    continue
                entry = dict(op)
                entry["viaje_id"] = str(viaje.id)
                entry["viaje"] = viaje.nombre
                items.append(entry)

        def _match(it: dict) -> bool:
            if tipo and it.get("tipo") != tipo:
                return False
            if estado and it.get("estado") != estado:
                return False
            if prioridad and it.get("prioridad") != prioridad:
                return False
            if responsable and responsable not in (str(it.get("responsable") or "").lower()):
                return False
            if search:
                blob = " ".join(
                    [
                        str(it.get("titulo") or ""),
                        str(it.get("viaje") or ""),
                        str(it.get("responsable") or ""),
                        str(it.get("proveedor") or ""),
                        str(it.get("notas") or ""),
                    ]
                ).lower()
                if search not in blob:
                    return False
            return True

        filtered = [it for it in items if _match(it)]

        ordering = query_params.get("ordering") or "-created_at"
        allowed_ordering = {
            "created_at",
            "-created_at",
            "fecha_inicio",
            "-fecha_inicio",
            "fecha_fin",
            "-fecha_fin",
            "prioridad",
            "-prioridad",
        }
        if ordering not in allowed_ordering:
            ordering = "-created_at"

        reverse = ordering.startswith("-")
        key = ordering[1:] if reverse else ordering

        def _sort_key(it: dict):
            val = it.get(key)
            return "" if val is None else str(val)

        filtered.sort(key=_sort_key, reverse=reverse)

        page = int(query_params.get("page", "1") or "1")
        page_size = int(query_params.get("page_size", "20") or "20")
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        start = (page - 1) * page_size
        end = start + page_size

        results = filtered[start:end]
        return Response({"count": len(filtered), "results": results}, status=status.HTTP_200_OK)


class ViajeOperacionesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, OperacionesRolePermission]

    def get(self, request, viaje_id):
        viaje = get_object_or_404(Viaje, id=viaje_id)
        items = []
        for op in _get_viaje_operaciones(viaje):
            if not isinstance(op, dict):
                continue
            entry = dict(op)
            entry["viaje_id"] = str(viaje.id)
            entry["viaje"] = viaje.nombre
            items.append(entry)
        return Response({"count": len(items), "results": items}, status=status.HTTP_200_OK)

    def post(self, request, viaje_id):
        viaje = get_object_or_404(Viaje, id=viaje_id)
        serializer = OperacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        op_id = str(uuid.uuid4())
        data["id"] = op_id
        now = timezone.now()
        data["created_at"] = now
        data["updated_at"] = now
        data = _normalize_operacion_for_json(data)
        ops = _get_viaje_operaciones(viaje)
        ops = list(ops)
        ops.insert(0, data)
        _save_viaje_operaciones(viaje, ops)

        result = dict(data)
        result["viaje_id"] = str(viaje.id)
        result["viaje"] = viaje.nombre
        return Response(result, status=status.HTTP_201_CREATED)


class ViajeOperacionDetailView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, OperacionesRolePermission]

    def patch(self, request, viaje_id, operacion_id):
        viaje = get_object_or_404(Viaje, id=viaje_id)
        ops = list(_get_viaje_operaciones(viaje))
        idx = next((i for i, it in enumerate(ops) if isinstance(it, dict) and str(it.get("id")) == str(operacion_id)), -1)
        if idx == -1:
            return Response({"detail": "Operación no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        serializer = OperacionSerializer(data={**ops[idx], **request.data}, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = dict(ops[idx])
        updated.update(serializer.validated_data)
        updated["updated_at"] = timezone.now()
        updated = _normalize_operacion_for_json(updated)
        ops[idx] = updated
        _save_viaje_operaciones(viaje, ops)

        result = dict(updated)
        result["viaje_id"] = str(viaje.id)
        result["viaje"] = viaje.nombre
        return Response(result, status=status.HTTP_200_OK)

    def delete(self, request, viaje_id, operacion_id):
        viaje = get_object_or_404(Viaje, id=viaje_id)
        ops = list(_get_viaje_operaciones(viaje))
        new_ops = [it for it in ops if not (isinstance(it, dict) and str(it.get("id")) == str(operacion_id))]
        if len(new_ops) == len(ops):
            return Response({"detail": "Operación no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        _save_viaje_operaciones(viaje, new_ops)
        return Response(status=status.HTTP_204_NO_CONTENT)
