from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import TicketSoporte


def _get_user_info(request):
    user = getattr(request, "user", None)
    email = getattr(user, "email", "") or ""
    tenant_id = getattr(user, "tenant_id", None) or getattr(
        getattr(user, "perfil", None), "tenant_id", None
    )
    return email, tenant_id


class TicketCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email, tenant_id = _get_user_info(request)
        asunto = request.data.get("asunto", "").strip()
        descripcion = request.data.get("descripcion", "").strip()
        prioridad = request.data.get("prioridad", "normal")
        viaje_id = request.data.get("viaje_id") or None

        if not asunto or not descripcion:
            return Response({"detail": "Asunto y descripción son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

        ticket = TicketSoporte.objects.create(
            tenant_id=tenant_id,
            admin_email=email,
            asunto=asunto,
            descripcion=descripcion,
            prioridad=prioridad,
            viaje_id=viaje_id,
        )

        return Response({
            "id": str(ticket.id),
            "numero": f"TKT-{str(ticket.id)[:8].upper()}",
            "asunto": ticket.asunto,
            "prioridad": ticket.prioridad,
            "estado": ticket.estado,
            "created_at": ticket.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


class TicketListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        email, tenant_id = _get_user_info(request)
        role = getattr(getattr(request, "user", None), "rol", "") or ""

        if role in ("superadmin",):
            tickets = TicketSoporte.objects.all()
        else:
            tickets = TicketSoporte.objects.filter(tenant_id=tenant_id)

        data = [{
            "id": str(t.id),
            "numero": f"TKT-{str(t.id)[:8].upper()}",
            "asunto": t.asunto,
            "prioridad": t.prioridad,
            "estado": t.estado,
            "admin_email": t.admin_email,
            "created_at": t.created_at.isoformat(),
            "respuesta": t.respuesta,
        } for t in tickets]

        return Response({"tickets": data, "total": len(data)})


class TicketUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, ticket_id):
        role = getattr(getattr(request, "user", None), "rol", "") or ""
        if role not in ("superadmin", "admin"):
            return Response({"detail": "Sin permisos."}, status=status.HTTP_403_FORBIDDEN)

        try:
            ticket = TicketSoporte.objects.get(id=ticket_id)
        except TicketSoporte.DoesNotExist:
            return Response({"detail": "Ticket no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if "estado" in request.data:
            ticket.estado = request.data["estado"]
        if "respuesta" in request.data:
            ticket.respuesta = request.data["respuesta"]
        ticket.save()

        return Response({"detail": "Ticket actualizado.", "estado": ticket.estado})
