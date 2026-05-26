from django.contrib.auth.models import AnonymousUser
from django.core.mail import send_mail
from django.conf import settings as django_settings
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers as drf_serializers, status, viewsets
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.usuarios.authentication import SupabaseAuthentication
from apps.usuarios.models import InvitacionUsuario, Perfil
from apps.usuarios.services import authenticate_with_supabase, get_profile_for_login
from apps.usuarios.serializers import PerfilSerializer
from apps.usuarios.tokens import build_token_pair, decode_app_token


def _request_query_params(request):
    return getattr(request, "query_params", None) or getattr(request, "GET", {})


def _normalize_auth_role(raw_role: str | None) -> str:
    raw = (raw_role or "").strip().lower()
    if raw == "superadmin":
        return "superadmin"
    if raw == "admin":
        return "admin"
    if raw == "profesor":
        return "profesor"
    return "viajero"


def _tenant_matches_request(request, tenant_id) -> bool:
    request_tenant_id = getattr(request, "tenant_id", None)
    return not (request_tenant_id and tenant_id and str(request_tenant_id) != str(tenant_id))


def _build_auth_response(*, user_id, email: str, nombre: str, tenant_id, role: str) -> Response:
    tokens = build_token_pair(
        user_id=str(user_id),
        email=email,
        tenant_id=str(tenant_id) if tenant_id else None,
        role=role,
    )
    return Response(
        {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": tokens["token_type"],
            "access_expires_in": tokens["access_expires_in"],
            "refresh_expires_in": tokens["refresh_expires_in"],
            "user": {
                "id": str(user_id),
                "email": email,
                "nombre": nombre,
                "tenant_id": str(tenant_id) if tenant_id else None,
                "role": role,
            },
        },
        status=status.HTTP_200_OK,
    )


def _get_perfil_from_request(request):
    if request.user and getattr(request.user, "is_authenticated", False) and not isinstance(request.user, AnonymousUser):
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


class PerfilesRolePermission(BasePermission):
    message = "No tienes permisos para esta acción."

    def has_permission(self, request, view):
        role = _current_role(request)
        if view.action == "list":
            return role in {"admin", "superadmin"}
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return role in {"admin", "superadmin", "profesor", "alumno"}
        return role in {"admin", "superadmin", "alumno"}

    def has_object_permission(self, request, view, obj):
        role = _current_role(request)
        if role in {"admin", "superadmin"}:
            return True
        perfil = _get_perfil_from_request(request)
        return bool(perfil and str(obj.id) == str(perfil.id))


@api_view(["GET"])
@authentication_classes([SupabaseAuthentication])
@permission_classes([AllowAny])
def debug_auth(request):
    """
    GET /api/debug-auth/
    Devuelve el estado de autenticación sin requerir permisos.
    Útil para diagnosticar problemas de JWT.
    """
    user = request.user
    is_auth = getattr(user, "is_authenticated", False) and not isinstance(user, AnonymousUser)

    perfil = None
    if is_auth:
        email = getattr(user, "email", None)
        if email:
            p = Perfil.objects.filter(email=email).first()
            if p:
                perfil = {"id": str(p.id), "email": p.email, "rol": p.rol}

    return Response({
        "autenticado": is_auth,
        "jwt_email": getattr(user, "email", None),
        "jwt_rol": getattr(user, "rol", None),
        "perfil_en_db": perfil,
    })


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not email or not password:
            return Response(
                {"detail": "Email y password son obligatorios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        auth_result = authenticate_with_supabase(email, password)
        auth_user = auth_result.get("user") or {}
        profile = get_profile_for_login(auth_user.get("email") or email, auth_user=auth_user)

        if not _tenant_matches_request(request, getattr(profile, "tenant_id", None)):
            return Response(
                {"detail": "El tenant del usuario no coincide con el tenant resuelto."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return _build_auth_response(
            user_id=getattr(profile, "id"),
            email=getattr(profile, "email", email),
            nombre=getattr(profile, "nombre", ""),
            tenant_id=getattr(profile, "tenant_id", None),
            role=_normalize_auth_role(getattr(profile, "rol", None)),
        )


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.data.get("refresh_token")
        if not refresh_token:
            return Response(
                {"detail": "refresh_token es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        claims = decode_app_token(refresh_token, expected_token_type="refresh")
        return _build_auth_response(
            user_id=claims.get("user_id") or claims.get("sub"),
            email=claims.get("email") or "",
            nombre=claims.get("nombre") or "",
            tenant_id=claims.get("tenant_id"),
            role=_normalize_auth_role(claims.get("role")),
        )




class PerfilMeView(APIView):
    """Devuelve el perfil del usuario autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        email = getattr(request.user, "email", None)
        if not email:
            return Response({"error": "No autenticado"}, status=401)
        perfil = Perfil.objects.filter(email=email).first()
        if not perfil:
            return Response({"error": "Perfil no encontrado"}, status=404)
        ROL_LABELS = {
            "admin": "Administrador",
            "superadmin": "Super Admin",
            "agencia": "Agencia",
            "viajero": "Viajero",
            "usuario": "Viajero",
            "alumno": "Viajero",
        }
        # Si el nombre está vacío, intentar leerlo del JWT de Supabase
        if not perfil.nombre:
            user_metadata = getattr(request.user, "user_metadata", {}) or {}
            full_name = user_metadata.get("full_name", "")
            if full_name:
                perfil.nombre = full_name
                perfil.save(update_fields=["nombre"])

        return Response({
            "id": str(perfil.id),
            "email": perfil.email,
            "nombre": perfil.nombre or "",
            "rol": perfil.rol or "viajero",
            "rol_label": ROL_LABELS.get(perfil.rol or "", "Viajero"),
            "tenant_id": str(perfil.tenant_id) if perfil.tenant_id else None,
        })

class PerfilViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, PerfilesRolePermission]
    serializer_class = PerfilSerializer
    queryset = Perfil.objects.all().order_by("-created_at")
    http_method_names = ["get", "put", "patch", "head", "options"]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["rol"]
    search_fields = ["email", "nombre"]
    ordering_fields = ["created_at", "email", "nombre"]
    ordering = ["-created_at"]

    def perform_update(self, serializer):
        perfil_req = _get_perfil_from_request(self.request)
        role = _current_role(self.request)
        if role != "admin":
            serializer.save(rol=getattr(perfil_req, "rol", "usuario"))
            return
        serializer.save()


# ── Gestión de usuarios del tenant ──────────────────────────────────────────

class TenantUsuariosListView(APIView):
    """GET /api/tenant/usuarios/ — lista usuarios del mismo tenant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = _current_role(request)
        if role not in {"admin", "superadmin"}:
            return Response({"detail": "Sin permisos."}, status=status.HTTP_403_FORBIDDEN)
        perfil = _get_perfil_from_request(request)
        tenant_id = getattr(perfil, "tenant_id", None)
        if not tenant_id:
            return Response({"detail": "Sin tenant asignado."}, status=status.HTTP_400_BAD_REQUEST)
        usuarios = Perfil.objects.filter(tenant_id=tenant_id).order_by("-created_at")
        return Response(PerfilSerializer(usuarios, many=True).data)


class CambiarRolView(APIView):
    """PATCH /api/perfiles/<uuid>/cambiar-rol/ — cambia rol de usuario del tenant."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        role = _current_role(request)
        if role not in {"admin", "superadmin"}:
            return Response({"detail": "Sin permisos."}, status=status.HTTP_403_FORBIDDEN)
        nuevo_rol = request.data.get("rol")
        if nuevo_rol not in {"admin", "usuario"}:
            return Response({"detail": "Rol inválido. Usa 'admin' o 'usuario'."}, status=status.HTTP_400_BAD_REQUEST)
        perfil_admin = _get_perfil_from_request(request)
        try:
            target = Perfil.objects.get(pk=pk)
        except Perfil.DoesNotExist:
            return Response({"detail": "Perfil no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        if role != "superadmin" and str(target.tenant_id) != str(getattr(perfil_admin, "tenant_id", "")):
            return Response({"detail": "El usuario no pertenece a tu tenant."}, status=status.HTTP_403_FORBIDDEN)
        target.rol = nuevo_rol
        target.save(update_fields=["rol"])
        return Response(PerfilSerializer(target).data)


# ── Invitaciones ─────────────────────────────────────────────────────────────

class InvitacionSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = InvitacionUsuario
        fields = ["id", "email", "rol", "status", "expires_at", "accepted_at", "created_at"]
        read_only_fields = ["id", "status", "expires_at", "accepted_at", "created_at"]


class InvitarUsuarioView(APIView):
    """POST /api/usuarios/invitar/ — invita un usuario al tenant con email."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.utils import timezone as tz
        role = _current_role(request)
        if role not in {"admin", "superadmin"}:
            return Response({"detail": "Sin permisos."}, status=status.HTTP_403_FORBIDDEN)

        email  = (request.data.get("email") or "").strip().lower()
        rol    = request.data.get("rol", "usuario")
        nombre = request.data.get("nombre", "")

        if not email:
            return Response({"detail": "email es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)
        if rol not in {"admin", "usuario"}:
            return Response({"detail": "rol debe ser 'admin' o 'usuario'."}, status=status.HTTP_400_BAD_REQUEST)

        perfil_admin = _get_perfil_from_request(request)
        tenant_id = getattr(perfil_admin, "tenant_id", None)
        if not tenant_id:
            return Response({"detail": "Sin tenant asignado."}, status=status.HTTP_400_BAD_REQUEST)

        if Perfil.objects.filter(email=email, tenant_id=tenant_id).exists():
            return Response({"detail": "Este usuario ya pertenece al tenant."}, status=status.HTTP_409_CONFLICT)

        inv, created = InvitacionUsuario.objects.get_or_create(
            tenant_id=tenant_id,
            email=email,
            defaults={"rol": rol, "created_by": getattr(perfil_admin, "id", None)},
        )
        if not created:
            if inv.status == InvitacionUsuario.ESTADO_ACEPTADA:
                return Response({"detail": "La invitación ya fue aceptada."}, status=status.HTTP_409_CONFLICT)
            inv.rol    = rol
            inv.status = InvitacionUsuario.ESTADO_PENDIENTE
            inv.token  = ""
            inv.expires_at = tz.now() + tz.timedelta(days=7)
            inv.save()

        import os
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        invite_link  = f"{frontend_url}/registro?token={inv.token}&email={email}"

        try:
            send_mail(
                subject="Invitación a ToTem HUB",
                message=(
                    f"Hola{' ' + nombre if nombre else ''},\n\n"
                    f"Has sido invitado a unirte a ToTem HUB como {rol}.\n\n"
                    f"Acepta tu invitación aquí: {invite_link}\n\n"
                    f"El enlace expira en 7 días."
                ),
                from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", "noreply@totemhub.com"),
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({
            "detail": "Invitación enviada.",
            "invite_link": invite_link,
            "invitation": InvitacionSerializer(inv).data,
        }, status=status.HTTP_201_CREATED)


class InvitacionesListView(APIView):
    """GET /api/usuarios/invitaciones/ — lista invitaciones pendientes del tenant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = _current_role(request)
        if role not in {"admin", "superadmin"}:
            return Response({"detail": "Sin permisos."}, status=status.HTTP_403_FORBIDDEN)
        perfil = _get_perfil_from_request(request)
        tenant_id = getattr(perfil, "tenant_id", None)
        invs = InvitacionUsuario.objects.filter(tenant_id=tenant_id).order_by("-created_at")
        return Response(InvitacionSerializer(invs, many=True).data)


class AceptarInvitacionView(APIView):
    """POST /api/usuarios/invitaciones/aceptar/ — el usuario acepta su invitación."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from django.utils import timezone as tz
        token = request.data.get("token", "")
        if not token:
            return Response({"detail": "token es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            inv = InvitacionUsuario.objects.get(token=token)
        except InvitacionUsuario.DoesNotExist:
            return Response({"detail": "Invitación no válida."}, status=status.HTTP_404_NOT_FOUND)
        if inv.status == InvitacionUsuario.ESTADO_ACEPTADA:
            return Response({"detail": "Invitación ya aceptada."}, status=status.HTTP_409_CONFLICT)
        if inv.expires_at < tz.now():
            inv.status = InvitacionUsuario.ESTADO_EXPIRADA
            inv.save(update_fields=["status"])
            return Response({"detail": "La invitación expiró."}, status=status.HTTP_410_GONE)
        inv.status      = InvitacionUsuario.ESTADO_ACEPTADA
        inv.accepted_at = tz.now()
        inv.save(update_fields=["status", "accepted_at"])
        return Response({
            "detail": "Invitación aceptada. Completa tu registro.",
            "tenant_id": str(inv.tenant_id),
            "email": inv.email,
            "rol": inv.rol,
        })
