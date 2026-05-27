import csv

from django.http import HttpResponse
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.documentos.utils import calcular_estado_docs
from apps.inscripciones.models import Inscripcion
from apps.planes.utils import check_inscription_limit
from apps.inscripciones.serializers import (
    InscripcionDetailSerializer,
    InscripcionListSerializer,
    InscripcionPublicaSerializer,
    InscripcionResumenSerializer,
    DatosSaludSerializer,
)
from apps.usuarios.models import Perfil
from apps.viajes.models import Viaje


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
    if user_role:
        return "viajero"

    raw = (getattr(_get_perfil_from_request(request), "rol", "") or "").lower()
    if raw == "superadmin":
        return "superadmin"
    if raw == "admin":
        return "admin"
    return "viajero"


def _current_tenant_id(request):
    perfil = _get_perfil_from_request(request)
    return getattr(perfil, "tenant_id", None) if perfil else None


def _apply_inscripciones_filters(request, queryset):
    buscar = request.query_params.get("buscar")
    if buscar:
        queryset = queryset.filter(Q(viajero__nombre__icontains=buscar) | Q(viajero__email__icontains=buscar))

    estado = request.query_params.get("estado")
    if estado:
        queryset = queryset.filter(estado=estado)

    tipo_habitacion = request.query_params.get("tipo_habitacion")
    if tipo_habitacion:
        queryset = queryset.filter(tipo_habitacion=tipo_habitacion)

    pago = request.query_params.get("pago")
    if pago and pago != "pendiente":
        return Inscripcion.objects.none()

    documentos = request.query_params.get("documentos")
    if documentos:
        allowed_docs = {"completo", "incompleto", "faltante", "pendiente"}
        if documentos not in allowed_docs:
            return Inscripcion.objects.none()
        ids_filtrados = [
            inscripcion.id
            for inscripcion in queryset
            if calcular_estado_docs(inscripcion) == documentos
        ]
        queryset = queryset.filter(id__in=ids_filtrados)

    ordering = request.query_params.get("ordering", "-created_at")
    allowed_ordering = {"created_at", "-created_at", "estado", "-estado", "viajero__nombre", "-viajero__nombre"}
    if ordering not in allowed_ordering:
        ordering = "-created_at"
    queryset = queryset.order_by(ordering)
    return queryset


class InscripcionesRolePermission(BasePermission):
    """Permisos base por rol para el MVP."""

    message = "No tienes permisos para esta acción."

    def has_permission(self, request, view):
        role = _current_role(request)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return role in {"admin", "superadmin", "viajero"}
        return role in {"admin", "superadmin", "viajero"}

    def has_object_permission(self, request, _view, obj):
        role = _current_role(request)
        if role in {"admin", "superadmin"}:
            return True
        if role == "viajero":
            perfil = _get_perfil_from_request(request)
            return bool(perfil and obj.viajero_id == perfil.id)
        return False




class AdminInscripcionesUsuariosView(generics.ListAPIView):
    """Admin only: lista todas las inscripciones agrupadas por usuario del tenant."""
    permission_classes = [IsAuthenticated]
    serializer_class = InscripcionListSerializer

    def get_queryset(self):
        role = _current_role(self.request)
        if role not in {"admin", "superadmin"}:
            raise PermissionDenied("Solo administradores pueden ver esta información.")
        tenant_id = _current_tenant_id(self.request)
        qs = (
            Inscripcion.objects
            .select_related("viajero", "viaje")
            .prefetch_related("documentos")
            .order_by("viajero__email", "-created_at")
        )
        if tenant_id:
            qs = qs.filter(viaje__tenant_id=tenant_id)
        return qs

    def list(self, request, *args, **kwargs):
        role = _current_role(request)
        if role not in {"admin", "superadmin"}:
            raise PermissionDenied("Solo administradores.")
        qs = self.get_queryset()
        # Agrupar por usuario
        from collections import defaultdict
        grupos = defaultdict(lambda: {"viajero_id": None, "viajero_nombre": "", "viajero_email": "", "inscripciones": []})
        for insc in qs:
            if not insc.viajero:
                continue
            email = insc.viajero.email
            grupos[email]["viajero_id"] = str(insc.viajero.id)
            grupos[email]["viajero_nombre"] = insc.viajero.nombre or ""
            grupos[email]["viajero_email"] = email
            grupos[email]["inscripciones"].append({
                "id": str(insc.id),
                "viaje_id": str(insc.viaje.id),
                "viaje_nombre": insc.viaje.nombre,
                "viaje_slug": insc.viaje.slug,
                "estado": insc.estado,
                "tipo_habitacion": insc.tipo_habitacion,
                "fecha_inicio": insc.viaje.fecha_inicio.isoformat() if insc.viaje.fecha_inicio else None,
                "fecha_fin": insc.viaje.fecha_fin.isoformat() if insc.viaje.fecha_fin else None,
                "created_at": insc.created_at.isoformat() if insc.created_at else None,
            })
        return Response({
            "total_usuarios": len(grupos),
            "total_inscripciones": qs.count(),
            "usuarios": list(grupos.values()),
        })

class InscripcionPorViajeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, InscripcionesRolePermission]
    serializer_class = InscripcionListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["estado", "tipo_habitacion"]
    search_fields = ["viajero__nombre", "viajero__email"]
    ordering_fields = ["created_at", "estado", "viajero__nombre"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = (
            Inscripcion.objects.select_related("viajero", "viaje").prefetch_related("documentos")
            .filter(viaje_id=self.kwargs["viaje_id"])
        )
        tenant_id = _current_tenant_id(self.request)
        if tenant_id:
            qs = qs.filter(viaje__tenant_id=tenant_id)
        qs = _apply_inscripciones_filters(self.request, qs)
        role = _current_role(self.request)
        if role == "alumno":
            perfil = _get_perfil_from_request(self.request)
            qs = qs.filter(viajero=perfil) if perfil else Inscripcion.objects.none()
        return qs

    def create(self, request, *args, **kwargs):
        role = _current_role(request)
        if role != "admin":
            return Response({"detail": "Solo admin puede crear inscripciones manuales."}, status=status.HTTP_403_FORBIDDEN)

        # Creacion rapida desde panel admin: acepta email + nombre_completo
        email = (request.data.get("email") or "").strip().lower()
        nombre_completo = (request.data.get("nombre_completo") or "").strip()

        if email:
            tenant_id = _current_tenant_id(request)
            perfil = Perfil.objects.filter(email=email).first()
            if not perfil:
                # Crear inscripcion sin perfil - datos del viajero en campos libres
                inscripcion_data = {
                    'viaje_id': kwargs['viaje_id'],
                    'viajero': None,
                    'estado': Inscripcion.ESTADO_PRE_INSCRITO,
                    'created_at': timezone.now(),
                }
                # Guardar email y nombre en datos_salud como metadata
                inscripcion_data['datos_salud'] = {
                    'email': email,
                    'nombre': nombre_completo or email.split('@')[0],
                }
                inscripcion = Inscripcion.objects.create(**inscripcion_data)
                serializer = InscripcionListSerializer(inscripcion)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            viaje_id = kwargs["viaje_id"]
            existing = Inscripcion.objects.filter(viaje_id=viaje_id, viajero=perfil).first()
            if existing:
                serializer = InscripcionListSerializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)
            inscripcion = Inscripcion.objects.create(
                viaje_id=viaje_id,
                viajero=perfil,
                estado=Inscripcion.ESTADO_PRE_INSCRITO,
                created_at=timezone.now(),
            )
            serializer = InscripcionListSerializer(inscripcion)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Fallback: flujo original con viajero UUID
        serializer = InscripcionDetailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(viaje_id=kwargs["viaje_id"])
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MisInscripcionesListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InscripcionListSerializer

    def get_queryset(self):
        perfil = _get_perfil_from_request(self.request)
        if not perfil:
            return Inscripcion.objects.none()
        return (
            Inscripcion.objects.select_related("viajero", "viaje").prefetch_related("documentos")
            .filter(viajero=perfil)
            .order_by("-created_at")
        )


class MisInscripcionDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InscripcionDetailSerializer

    def get_object(self):
        perfil = _get_perfil_from_request(self.request)
        if not perfil:
            raise NotFound("Inscripción no encontrada.")
        obj = (
            Inscripcion.objects.select_related("viaje", "viajero").prefetch_related("documentos")
            .filter(id=self.kwargs["inscripcion_id"], viajero=perfil)
            .first()
        )
        if not obj:
            raise NotFound("Inscripción no encontrada.")
        return obj

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        data = self.get_serializer(obj).data
        # Vista de viajero: no exponer datos de salud completos.
        data.pop("datos_salud", None)
        return Response(data, status=status.HTTP_200_OK)


class InscripcionPublicaView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = InscripcionPublicaSerializer

    def create(self, request, *args, **kwargs):
        viaje = get_object_or_404(Viaje, slug=kwargs["slug"])
        check_inscription_limit(viaje.tenant_id)
        serializer = self.get_serializer(data=request.data, context={"viaje": viaje})
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        email = data["email"].lower()

        # 1. Buscar Perfil del viajero por email o por usuario autenticado
        from apps.usuarios.models import Perfil
        perfil = None

        # Intentar primero por el email del formulario (el usuario ya debería existir en Perfil)
        perfil = Perfil.objects.filter(email=email).first()

        # Si no existe en Perfil, intentamos crearlo si es que el usuario está autenticado en Supabase
        if not perfil:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                from apps.usuarios.authentication import SupabaseAuthentication
                try:
                    auth_result = SupabaseAuthentication().authenticate(request)
                    if auth_result:
                        user, _ = auth_result
                        # Si el email coincide o si simplemente confiamos en el token activo
                        perfil = Perfil.objects.create(
                            id=user.id,
                            email=user.email,
                            nombre=data.get("nombre", "") + " " + data.get("apellidos", ""),
                            rol="usuario",
                            tenant_id=viaje.tenant_id,
                            created_at=timezone.now()
                        )
                except Exception as e:
                    print(f"Error creando perfil al vuelo: {e}")
                    pass

        # MVP: Si no hay perfil registrado, guardar inscripción como pre-registro
        # sin FK a perfiles (viajero=None) usando datos del formulario
        if not perfil:
            inscripcion_data = {
                "tipo_habitacion": data.get("tipo_habitacion"),
                "datos_salud": data.get("datos_salud", {}),
                "estado": Inscripcion.ESTADO_PRE_INSCRITO,
            }
            # Guardar datos del viajero en datos_salud como metadata
            inscripcion_data["datos_salud"]["_viajero"] = {
                "nombre": data.get("nombre", ""),
                "apellidos": data.get("apellidos", ""),
                "dni": data.get("dni", ""),
                "email": email,
                "telefono": data.get("telefono", ""),
            }
            from django.utils import timezone as tz2
            inscripcion = Inscripcion.objects.create(
                viaje=viaje,
                viajero=None,
                created_at=tz2.now(),
                **inscripcion_data,
            )
            return Response({
                "id": str(inscripcion.id),
                "estado": inscripcion.estado,
                "mensaje": "Pre-inscripción registrada. Te contactaremos al email proporcionado.",
                "viajero_email": email,
            }, status=status.HTTP_201_CREATED)

        # 2. Crear o recuperar inscripción
        # Quitamos los campos del viajero antes de guardar la inscripción
        inscripcion_data = {
            "tipo_habitacion": data.get("tipo_habitacion"),
            "datos_salud": data.get("datos_salud", {}),
        }

        # Usamos update_or_create para que si ya existe, se actualice y nos deje pasar
        inscripcion, created = Inscripcion.objects.update_or_create(
            viaje=viaje,
            viajero=perfil,
            defaults={
                "estado": Inscripcion.ESTADO_PRE_INSCRITO,
                "created_at": timezone.now(),
                **inscripcion_data
            }
        )

        # 3. Generar token de acceso automático para el nuevo perfil
        from apps.usuarios.tokens import build_token_pair
        tokens = build_token_pair(
            user_id=str(perfil.id),
            email=perfil.email,
            tenant_id=str(perfil.tenant_id) if perfil.tenant_id else None,
            role="viajero",  # Rol normal de viajero
        )

        return Response(
            {
                "id": inscripcion.id,
                "estado": inscripcion.estado,
                "viajero": {
                    "id": perfil.id,
                    "email": perfil.email,
                    "nombre": perfil.nombre
                },
                "auth": {
                    "access_token": tokens["access_token"],
                    "refresh_token": tokens["refresh_token"],
                    "user": {
                        "id": str(perfil.id),
                        "email": perfil.email,
                        "nombre": perfil.nombre,
                        "role": "viajero",
                        "tenant_id": str(perfil.tenant_id) if perfil.tenant_id else None,
                    }
                }
            },
            status=status.HTTP_201_CREATED
        )


class DatosSaludDetailUpdateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, InscripcionesRolePermission]
    serializer_class = DatosSaludSerializer

    def _assert_admin(self):
        role = _current_role(self.request)
        if role != "admin":
            raise PermissionDenied("Solo admin puede acceder a datos de salud.")

    def get(self, request, inscripcion_id):
        self._assert_admin()
        inscripcion = get_object_or_404(Inscripcion.objects.select_related("viaje"), id=inscripcion_id)
        tenant_id = _current_tenant_id(request)
        if tenant_id and str(inscripcion.viaje.tenant_id) != str(tenant_id):
            raise PermissionDenied("No tienes permisos para esta inscripción.")
        data = inscripcion.datos_salud if isinstance(inscripcion.datos_salud, dict) else {}
        serializer = self.get_serializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, inscripcion_id):
        self._assert_admin()
        inscripcion = get_object_or_404(Inscripcion.objects.select_related("viaje"), id=inscripcion_id)
        tenant_id = _current_tenant_id(request)
        if tenant_id and str(inscripcion.viaje.tenant_id) != str(tenant_id):
            raise PermissionDenied("No tienes permisos para esta inscripción.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inscripcion.datos_salud = serializer.validated_data
        inscripcion.save(update_fields=["datos_salud"])
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, inscripcion_id):
        self._assert_admin()
        inscripcion = get_object_or_404(Inscripcion.objects.select_related("viaje"), id=inscripcion_id)
        tenant_id = _current_tenant_id(request)
        if tenant_id and str(inscripcion.viaje.tenant_id) != str(tenant_id):
            raise PermissionDenied("No tienes permisos para esta inscripción.")
        current = inscripcion.datos_salud if isinstance(inscripcion.datos_salud, dict) else {}
        serializer = self.get_serializer(data={**current, **request.data})
        serializer.is_valid(raise_exception=True)
        inscripcion.datos_salud = serializer.validated_data
        inscripcion.save(update_fields=["datos_salud"])
        return Response(serializer.data, status=status.HTTP_200_OK)


class InscripcionExportarView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, InscripcionesRolePermission]

    def get(self, request, viaje_id):
        role = _current_role(request)
        if role not in {"admin", "profesor"}:
            return Response({"detail": "No tienes permisos para exportar."}, status=status.HTTP_403_FORBIDDEN)

        queryset = (
            Inscripcion.objects.select_related("viajero").prefetch_related("documentos")
            .filter(viaje_id=viaje_id)
        )
        queryset = _apply_inscripciones_filters(request, queryset)
        if role == "alumno":
            perfil = _get_perfil_from_request(request)
            queryset = queryset.filter(viajero=perfil) if perfil else Inscripcion.objects.none()

        formato = (request.query_params.get("formato", "csv") or "csv").lower()
        if formato == "json":
            serializer = InscripcionListSerializer(queryset, many=True)
            return Response({"count": len(serializer.data), "results": serializer.data}, status=status.HTTP_200_OK)
        if formato != "csv":
            return Response({"detail": "formato inválido. Usa csv o json."}, status=status.HTTP_400_BAD_REQUEST)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="inscripciones_{viaje_id}.csv"'
        writer = csv.writer(response)
        writer.writerow(["id", "viajero_nombre", "viajero_email", "estado", "tipo_habitacion", "created_at"])
        for item in queryset:
            writer.writerow(
                [
                    str(item.id),
                    getattr(item.viajero, "nombre", ""),
                    getattr(item.viajero, "email", ""),
                    item.estado,
                    item.tipo_habitacion,
                    item.created_at.isoformat() if item.created_at else "",
                ]
            )
        return response


class InscripcionAccionMasivaView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, InscripcionesRolePermission]

    def post(self, request, viaje_id):
        role = _current_role(request)
        if role != "admin":
            return Response(
                {"detail": "Solo admin puede ejecutar acciones masivas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        accion = request.data.get("accion")
        inscripcion_ids = request.data.get("inscripcion_ids", [])
        if not isinstance(inscripcion_ids, list) or not inscripcion_ids:
            return Response(
                {"detail": "inscripcion_ids debe ser una lista no vacía."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = Inscripcion.objects.filter(viaje_id=viaje_id, id__in=inscripcion_ids)
        if accion == "cambiar_estado":
            nuevo_estado = request.data.get("estado")
            estados_validos = {e[0] for e in Inscripcion.ESTADOS}
            if nuevo_estado not in estados_validos:
                return Response(
                    {"detail": "estado inválido para acción masiva."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            updated = queryset.update(estado=nuevo_estado)
            return Response(
                {
                    "accion": accion,
                    "estado": nuevo_estado,
                    "afectados": updated,
                },
                status=status.HTTP_200_OK,
            )

        if accion == "recordatorio":
            # Placeholder MVP: aquí se integrará apps.notificaciones.
            return Response(
                {
                    "accion": accion,
                    "afectados": queryset.count(),
                    "detalle": "recordatorio_en_cola_mvp",
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"detail": "acción masiva no soportada."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class InscripcionResumenView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, InscripcionesRolePermission]
    serializer_class = InscripcionResumenSerializer

    def get_object(self):
        return get_object_or_404(
            Inscripcion.objects.select_related("viajero", "viaje", "datos_salud").prefetch_related("documentos"),
            id=self.kwargs["inscripcion_id"],
        )

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        data = self.get_serializer(obj).data
        role = _current_role(request)
        if role != "admin":
            data.pop("datos_salud_completitud", None)
        return Response(data, status=status.HTTP_200_OK)


class InscripcionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, InscripcionesRolePermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["estado", "tipo_habitacion", "viaje"]
    search_fields = ["viajero__nombre", "viajero__email"]
    ordering_fields = ["created_at", "estado", "viajero__nombre"]
    ordering = ["-created_at"]
    http_method_names = ["get", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Inscripcion.objects.select_related("viajero", "viaje").prefetch_related("documentos")
        qs = _apply_inscripciones_filters(self.request, qs)
        role = _current_role(self.request)
        if role == "alumno":
            perfil = _get_perfil_from_request(self.request)
            qs = qs.filter(viajero=perfil) if perfil else Inscripcion.objects.none()
        return qs

    def get_serializer_class(self):
        if self.action in {"retrieve", "update", "partial_update"}:
            return InscripcionDetailSerializer
        return InscripcionListSerializer

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        role = _current_role(request)
        if role != "admin" and isinstance(response.data, dict):
            response.data.pop("datos_salud", None)
        return response

class AdminDashboardStatsView(generics.GenericAPIView):
    """GET /api/admin/stats/ — KPIs y graficos para el dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = _current_role(request)
        if role not in {"admin", "superadmin"}:
            from rest_framework.response import Response
            from rest_framework import status as drf_status
            return Response({"detail": "Solo admin."}, status=drf_status.HTTP_403_FORBIDDEN)
        
        tenant_id = _current_tenant_id(request)
        from django.db import connection
        from rest_framework.response import Response

        with connection.cursor() as c:
            # KPIs principales
            c.execute("SELECT COUNT(*) FROM viajes WHERE status='publicado' AND tenant_id=%s", [str(tenant_id)])
            viajes_activos = c.fetchone()[0]

            c.execute("SELECT COUNT(*) FROM viajes WHERE status='borrador' AND tenant_id=%s", [str(tenant_id)])
            viajes_borrador = c.fetchone()[0]

            c.execute("""
                SELECT COUNT(DISTINCT i.user_id) FROM inscripciones i
                JOIN viajes v ON v.id = i.viaje_id
                WHERE v.tenant_id=%s AND i.user_id IS NOT NULL
            """, [str(tenant_id)])
            total_inscritos = c.fetchone()[0]

            c.execute("""
                SELECT COUNT(*) FROM inscripciones i
                JOIN viajes v ON v.id = i.viaje_id
                WHERE v.tenant_id=%s AND i.status='confirmado'
            """, [str(tenant_id)])
            confirmados = c.fetchone()[0]

            # Pagos
            c.execute("""
                SELECT p.status, COUNT(*), COALESCE(SUM(p.monto),0)
                FROM pagos p
                JOIN inscripciones i ON i.id = p.inscripcion_id
                JOIN viajes v ON v.id = i.viaje_id
                WHERE v.tenant_id=%s
                GROUP BY p.status
            """, [str(tenant_id)])
            pagos_rows = c.fetchall()
            pagos = {row[0]: {"count": row[1], "total": float(row[2])} for row in pagos_rows}

            # Inscripciones por mes (ultimos 6 meses)
            c.execute("""
                SELECT TO_CHAR(DATE_TRUNC('month', i.created_at), 'Mon YYYY') as mes,
                       COUNT(*) as total
                FROM inscripciones i
                JOIN viajes v ON v.id = i.viaje_id
                WHERE v.tenant_id=%s
                AND i.created_at >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', i.created_at)
                ORDER BY DATE_TRUNC('month', i.created_at)
            """, [str(tenant_id)])
            inscripciones_mes = [{"mes": row[0], "total": row[1]} for row in c.fetchall()]

            # Top viajes por inscritos
            c.execute("""
                SELECT v.nombre, COUNT(i.id) as inscritos
                FROM viajes v
                LEFT JOIN inscripciones i ON i.viaje_id = v.id
                WHERE v.tenant_id=%s AND v.status='publicado'
                GROUP BY v.nombre
                ORDER BY inscritos DESC
                LIMIT 5
            """, [str(tenant_id)])
            top_viajes = [{"nombre": row[0], "inscritos": row[1]} for row in c.fetchall()]

        return Response({
            "kpis": {
                "viajes_activos": viajes_activos,
                "viajes_borrador": viajes_borrador,
                "total_inscritos": total_inscritos,
                "confirmados": confirmados,
                "pagos_verificados": pagos.get("verificado", {}).get("count", 0),
                "pagos_pendientes": pagos.get("pendiente", {}).get("count", 0),
                "ingresos_verificados": pagos.get("verificado", {}).get("total", 0),
                "ingresos_pendientes": pagos.get("pendiente", {}).get("total", 0),
            },
            "inscripciones_por_mes": inscripciones_mes,
            "top_viajes": top_viajes,
            "pagos_por_estado": [
                {"estado": k, "count": v["count"], "total": v["total"]}
                for k, v in pagos.items()
            ],
        })
