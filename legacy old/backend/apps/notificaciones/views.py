from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.documentos.models import DocumentoViajero
from apps.inscripciones.models import Inscripcion
from apps.pagos.models import Pago
from apps.usuarios.models import Perfil
from apps.viajes.models import Viaje


def _get_perfil_from_request(request):
    if request.user and getattr(request.user, "is_authenticated", False):
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


class NotificacionesRolePermission(BasePermission):
    message = "No tienes permisos para esta acción."

    def has_permission(self, request, _view):
        role = _current_role(request)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return role in {"admin", "superadmin", "profesor", "alumno"}
        return role in {"admin", "superadmin", "profesor", "alumno"}


def _cache_key(perfil_id: str) -> str:
    return f"notifs_read:{perfil_id}"


def _get_read_set(perfil_id: str) -> set:
    value = cache.get(_cache_key(perfil_id))
    if isinstance(value, set):
        return value
    return set(value) if isinstance(value, (list, tuple)) else set()


def _set_read_set(perfil_id: str, ids: set) -> None:
    cache.set(_cache_key(perfil_id), set(ids), timeout=60 * 60 * 24 * 30)


def _make_notif(id_, titulo, cuerpo, tipo, created_at, link=None):
    return {
        "id": id_,
        "titulo": titulo,
        "cuerpo": cuerpo,
        "tipo": tipo,
        "created_at": created_at,
        "link": link,
    }


class NotificacionesListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, NotificacionesRolePermission]

    def get(self, request):
        perfil = _get_perfil_from_request(request)
        if not perfil:
            return Response({"detail": "No autenticado."}, status=status.HTTP_401_UNAUTHORIZED)

        role = _current_role(request)
        now = timezone.now()
        today = now.date()

        items = []

        if role in {"admin", "profesor"}:
            qs = Inscripcion.objects.select_related("viajero", "viaje").all()
        else:
            qs = Inscripcion.objects.select_related("viajero", "viaje").filter(viajero=perfil)

        pendientes_pago = qs.filter(estado=Inscripcion.ESTADO_PENDIENTE_PAGO).order_by("-created_at")[:50]
        for ins in pendientes_pago:
            items.append(
                _make_notif(
                    f"insc_pendiente_pago:{ins.id}",
                    "Pago pendiente",
                    f"{ins.viajero.nombre or ins.viajero.email} tiene pago pendiente en {ins.viaje.nombre}.",
                    "accion",
                    ins.created_at.isoformat() if ins.created_at else now.isoformat(),
                    link="/admin/reservas" if role in {"admin", "profesor"} else "/viajero/pagos",
                )
            )

        if role in {"admin", "profesor"}:
            docs_qs = DocumentoViajero.objects.select_related("inscripcion__viajero", "inscripcion__viaje").filter(
                estado__in=[DocumentoViajero.ESTADO_PENDIENTE, DocumentoViajero.ESTADO_EN_REVISION]
            ).order_by("-created_at")[:50]
        else:
            docs_qs = DocumentoViajero.objects.select_related("inscripcion__viajero", "inscripcion__viaje").filter(
                inscripcion__viajero=perfil
            ).filter(
                estado__in=[DocumentoViajero.ESTADO_PENDIENTE, DocumentoViajero.ESTADO_RECHAZADO]
            ).order_by("-created_at")[:50]

        for d in docs_qs:
            if role in {"admin", "profesor"}:
                titulo = "Documentos por revisar"
                cuerpo = f"{d.inscripcion.viajero.nombre or d.inscripcion.viajero.email}: {d.tipo} en {d.inscripcion.viaje.nombre}."
                link = f"/admin/viajes/{d.inscripcion.viaje_id}/inscripciones"
                tipo = "info"
            else:
                titulo = "Documento pendiente"
                cuerpo = f"{d.tipo}: estado {d.estado}."
                link = "/viajero/documentos"
                tipo = "accion"
            items.append(
                _make_notif(
                    f"doc:{d.id}",
                    titulo,
                    cuerpo,
                    tipo,
                    d.created_at.isoformat(),
                    link=link,
                )
            )

        if role in {"admin", "profesor"}:
            viajes = Viaje.objects.all().order_by("-created_at")[:200]
            for v in viajes:
                cfg = v.configuracion if isinstance(v.configuracion, dict) else {}
                ops = cfg.get("operaciones")
                if not isinstance(ops, list):
                    continue
                for op in ops:
                    if not isinstance(op, dict):
                        continue
                    if op.get("estado") != "atrasado":
                        continue
                    op_id = op.get("id") or ""
                    titulo = op.get("titulo") or "Operación atrasada"
                    responsable = op.get("responsable") or "—"
                    items.append(
                        _make_notif(
                            f"op_atrasado:{v.id}:{op_id}",
                            "Operación atrasada",
                            f"{titulo} (Resp: {responsable}) en {v.nombre}.",
                            "alerta",
                            str(op.get("updated_at") or op.get("created_at") or now.isoformat()),
                            link="/admin/operaciones",
                        )
                    )

        pagos_qs = Pago.objects.select_related("inscripcion__viajero", "inscripcion__viaje", "cuota")
        if role == "alumno":
            pagos_qs = pagos_qs.filter(inscripcion__viajero=perfil)

        vencidos = pagos_qs.filter(
            Q(estado=Pago.ESTADO_PENDIENTE) & Q(cuota__fecha_vencimiento__isnull=False) & Q(cuota__fecha_vencimiento__lt=today)
        ).order_by("-created_at")[:50]
        for p in vencidos:
            items.append(
                _make_notif(
                    f"pago_vencido:{p.id}",
                    "Pago vencido",
                    f"{p.inscripcion.viajero.nombre or p.inscripcion.viajero.email} — {p.inscripcion.viaje.nombre}.",
                    "alerta",
                    p.created_at.isoformat(),
                    link="/admin/pagos" if role in {"admin", "profesor"} else "/viajero/pagos",
                )
            )

        items.sort(key=lambda x: x.get("created_at") or "", reverse=True)

        read_ids = _get_read_set(str(perfil.id))
        for it in items:
            it["leida"] = it["id"] in read_ids

        if (request.query_params.get("unread") or "").strip() in {"1", "true", "yes"}:
            items = [it for it in items if not it.get("leida")]

        page = int(request.query_params.get("page", "1") or "1")
        page_size = int(request.query_params.get("page_size", "20") or "20")
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        start = (page - 1) * page_size
        end = start + page_size

        return Response({"count": len(items), "results": items[start:end]}, status=status.HTTP_200_OK)


class NotificacionesMarcarView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, NotificacionesRolePermission]

    def post(self, request):
        perfil = _get_perfil_from_request(request)
        if not perfil:
            return Response({"detail": "No autenticado."}, status=status.HTTP_401_UNAUTHORIZED)

        ids = request.data.get("ids", [])
        leida = request.data.get("leida", True)

        if not isinstance(ids, list) or not all(isinstance(x, str) for x in ids):
            return Response({"detail": "ids debe ser una lista de strings."}, status=status.HTTP_400_BAD_REQUEST)

        read_ids = _get_read_set(str(perfil.id))
        if leida:
            read_ids.update(ids)
        else:
            read_ids.difference_update(ids)
        _set_read_set(str(perfil.id), read_ids)
        return Response({"ok": True, "leidas": len(read_ids)}, status=status.HTTP_200_OK)
