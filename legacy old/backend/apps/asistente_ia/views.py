import json
import secrets
from uuid import UUID
from datetime import timedelta
from collections.abc import Iterable

from django.db import connection
from django.http import JsonResponse, StreamingHttpResponse
from django.utils import timezone

from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.renderers import BaseRenderer, JSONRenderer

from apps.usuarios.models import Perfil
from apps.viajes.models import Viaje

from .models import AsistenteIaLead, AsistenteIaSession
from .permissions import LeadRateThrottle, MessageRateThrottle, SessionRateThrottle
from .serializers import (
    AgencyLeadDetailSerializer,
    AgencyLeadListSerializer,
    CreateLeadSerializer,
    CreateSessionSerializer,
    LeadStatusUpdateSerializer,
    SendMessageSerializer,
)

from .ai.memory.session_memory import conversation_manager
from .ai.parsers.response_parser import intent_engine
from .ai.tools.lead_notifier import lead_notifier
from .ai.llm.openrouter_client import openrouter_client
from .ai.orchestrator.hermes_agent import Hermes
from .ai.rag.retriever import rag_engine


# =========================
# HELPERS
# =========================

def _sse_payload(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _json_safe(value):
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return str(value)


def _session_is_expired(session) -> bool:
    expires_at = getattr(session, "expires_at", None)
    return bool(expires_at and expires_at <= timezone.now())


def _intent_to_dict(intent) -> dict:
    if not intent:
        return {}

    return {
        "destination": getattr(intent, "destination", None),
        "duration": getattr(intent, "duration", None),
        "group_type": getattr(intent, "group_type", None),
        "group_size": getattr(intent, "group_size", None),
        "budget_range": getattr(intent, "budget_range", None),
        "interests": getattr(intent, "interests", None),
        "departure_month": getattr(intent, "departure_month", None),
        "needs_clarification": getattr(intent, "needs_clarification", False),
        "clarification_question": getattr(intent, "clarification_question", None),
        "confidence_score": getattr(intent, "confidence_score", 0.0),
        "fields_detected": getattr(intent, "fields_detected", 0),
    }


def _resolve_admin_company_id(request):
    role = (getattr(request.user, "rol", "") or "").lower()
    if role == "superadmin":
        query_params = getattr(request, "query_params", None) or getattr(request, "GET", {})
        override_company_id = query_params.get("company_id") or request.headers.get("X-Company-ID")
        if override_company_id:
            return override_company_id

    user_email = getattr(request.user, "email", None)
    if not user_email:
        return None

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT tenant_id FROM perfiles WHERE LOWER(email) = LOWER(%s) LIMIT 1",
                [user_email]
            )
            row = cursor.fetchone()
            return str(row[0]) if row else None
    except Exception:
        return None


class IsAgencyAdminPermission(BasePermission):
    def has_permission(self, request, view):
        role = (getattr(request.user, "rol", "") or "").lower()
        return role in {"admin", "superadmin"}


class AgencyLeadsPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


# =========================
# SESSION
# =========================

class CreateSessionView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [SessionRateThrottle]

    def post(self, request):
        serializer = CreateSessionSerializer(data=request.data or {})
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=400)

        language = serializer.validated_data.get("language", "es")
        user_name = serializer.validated_data.get("user_name", "")

        now = timezone.now()
        expires_at = now + timedelta(hours=24)

        session = AsistenteIaSession.objects.create(
            session_token=secrets.token_hex(32),
            language=language,
            created_at=now,
            expires_at=expires_at,
            status="active",
        )

        welcome = f"Hola {user_name}".strip()
        welcome_message = f"{welcome if user_name else 'Hola'}, soy tu asistente de viajes."

        conversation_manager.add_message(session.session_token, "assistant", welcome_message)
        conversation_manager.set_language(session.session_token, language)

        return JsonResponse({
            "session_id": str(session.id),
            "session_token": session.session_token,
            "welcome_message": welcome_message,
            "language": language,
            "expires_at": expires_at.isoformat(),
        }, status=201)


# =========================
# CHAT
# =========================



class EventStreamRenderer(BaseRenderer):
    media_type = 'text/event-stream'
    format = 'sse'
    charset = 'utf-8'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class MessageView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [MessageRateThrottle]
    renderer_classes = [EventStreamRenderer, JSONRenderer]

    def post(self, request, pk):
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=400)

        session_token = serializer.validated_data["session_token"]
        content = serializer.validated_data["content"]

        session = AsistenteIaSession.objects.filter(
            id=pk,
            session_token=session_token,
            status="active"
        ).first()

        if not session:
            return JsonResponse({"error": "sesión inválida"}, status=400)

        if _session_is_expired(session):
            if hasattr(session, "status"):
                session.status = "expired"
            if hasattr(session, "save"):
                session.save(update_fields=["status"])
            return JsonResponse({"error": "sesión expirada"}, status=400)

        # detect language
        language = (
            conversation_manager.get_language(session_token)
            or intent_engine.detect_language(content)
            or getattr(session, "language", "es")
            or "es"
        )

        conversation_manager.add_message(session_token, "user", content)
        messages = conversation_manager.get_messages(session_token)

        hermes = Hermes(
            intent_engine=intent_engine,
            rag_engine=rag_engine,
            conversation_manager=conversation_manager,
            openrouter_client=openrouter_client
        )

        accumulated_intent = session.intent_data or {}

        def stream():
            try:
                if hasattr(intent_engine, "extract_intent"):
                    intent = intent_engine.extract_intent(messages, language)
                    if intent:
                        session.intent_data = _intent_to_dict(intent)
                        conversation_manager.save_intent(session_token, session.intent_data)

                        if getattr(intent, "needs_clarification", False):
                            question = getattr(intent, "clarification_question", None) or (
                                "¿Podrías contarme más sobre el viaje que estás buscando?"
                            )
                            yield _sse_payload({
                                "type": "clarification",
                                "question": question,
                                "data": session.intent_data,
                            })
                            yield _sse_payload({"type": "done"})
                            return

                
                final_result = None

                # Iterate over the Hermes generator — each intermediate event
                # (pipeline_progress, tool_start, tool_done) is forwarded to the
                # SSE client immediately so the user sees live pipeline progress.
                for event in hermes.run(session_token, content, language, accumulated_intent=accumulated_intent):
                    if event["type"] == "final_result":
                        final_result = event["data"]
                        break
                    yield _sse_payload(event)

                if not final_result:
                    yield _sse_payload({"type": "error", "message": "El pipeline no retornó resultado"})
                    return

                matches      = final_result.get("matches", [])
                response     = _json_safe(final_result.get("response", ""))
                tool_results = _json_safe(final_result.get("tool_results", []))
                intent       = final_result.get("intent")

                # Persistir turno completo en session.messages
                now_iso = timezone.now().isoformat()
                safe_tool_results = [
                    {"tool_name": tr.get("tool_name"), "result": _json_safe(tr.get("result"))}
                    for tr in tool_results
                ]
                current_messages = list(getattr(session, "messages", []) or [])
                current_messages.append({"role": "user", "content": content, "ts": now_iso})
                current_messages.append({
                    "role": "assistant",
                    "content": response,
                    "tool_results": safe_tool_results,
                    "ts": now_iso,
                })
                session.messages = current_messages

                # Actualizar intent_data — MERGE con turno anterior, no sobreescribir
                update_fields = ["messages"]
                if intent:
                    prev = session.intent_data or {}
                    def _pick(new_val, prev_key):
                        """Usa el valor nuevo si existe, sino conserva el anterior."""
                        return new_val if new_val not in (None, "", [], {}) else prev.get(prev_key)

                    session.intent_data = {
                        "destination":     _pick(getattr(intent, "destination", None),     "destination"),
                        "duration":        _pick(getattr(intent, "duration", None),        "duration"),
                        "group_type":      _pick(getattr(intent, "group_type", None),      "group_type"),
                        "group_size":      _pick(getattr(intent, "group_size", None),      "group_size"),
                        "budget_range":    _pick(getattr(intent, "budget_range", None),    "budget_range"),
                        "interests":       _pick(getattr(intent, "interests", []) or [],   "interests"),
                        "departure_month": _pick(getattr(intent, "departure_month", None), "departure_month"),
                    }
                    update_fields.append("intent_data")

                conversation_manager.save_intent(session_token, session.intent_data or {})
                if hasattr(session, "save"):
                    session.save(update_fields=update_fields)

                # 1. Viajes encontrados por RAG
                if matches:
                    yield _sse_payload({"type": "matches", "data": matches})

                # 2. Resultados de tools (hoteles, lugares, vuelos, rutas, clima, presupuesto, itinerario)
                for tool_result in tool_results:
                    yield _sse_payload({"type": "tool_result", "data": tool_result})
                    result_data = tool_result.get("result", {})
                    if isinstance(result_data, dict) and "map_update" in result_data:
                        yield _sse_payload({"type": "map_update", "data": result_data["map_update"]})

                # 3. Respuesta del LLM
                yield _sse_payload({"type": "token", "content": response})

                conversation_manager.add_message(session_token, "assistant", response)

                yield _sse_payload({"type": "done"})

            except Exception as e:
                yield _sse_payload({"type": "error", "message": str(e)})

        response = StreamingHttpResponse(stream(), content_type="text/event-stream")
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


# =========================
# LEADS LIST
# =========================

class AgencyLeadsListView(ListAPIView):
    permission_classes = [IsAuthenticated, IsAgencyAdminPermission]
    serializer_class = AgencyLeadListSerializer
    pagination_class = AgencyLeadsPagination

    def get_queryset(self):
        company_id = _resolve_admin_company_id(self.request)
        if not company_id:
            return AsistenteIaLead.objects.none()

        qs = AsistenteIaLead.objects.filter(company_id=company_id).order_by("-created_at")

        status_filter = self.request.query_params.get("status", "all")
        if status_filter != "all":
            qs = qs.filter(status=status_filter)

        return qs


# =========================
# LEAD DETAIL
# =========================

class AgencyLeadDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AgencyLeadDetailSerializer
    queryset = AsistenteIaLead.objects.all()

    def get_queryset(self):
        company_id = _resolve_admin_company_id(self.request)
        if not company_id:
            return AsistenteIaLead.objects.none()

        return AsistenteIaLead.objects.filter(company_id=company_id)


# =========================
# CREATE LEAD
# =========================

class CreateLeadView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LeadRateThrottle]

    def post(self, request):
        serializer = CreateLeadSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=400)

        data = serializer.validated_data

        session = AsistenteIaSession.objects.filter(
            session_token=data["session_token"],
            status="active"
        ).first()

        if not session:
            return JsonResponse({"error": "session inválida"}, status=400)

        if _session_is_expired(session):
            if hasattr(session, "status"):
                session.status = "expired"
            if hasattr(session, "save"):
                session.save(update_fields=["status"])
            return JsonResponse({"error": "session expirada"}, status=400)

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM companies WHERE id = %s LIMIT 1",
                [str(data["company_id"])],
            )
            company_exists = cursor.fetchone()
        if not company_exists:
            return JsonResponse({"error": "empresa no válida"}, status=404)

        trip_exists = Viaje.objects.filter(
            id=data["trip_id"],
            estado="publicado"
        ).exists()

        if not trip_exists:
            return JsonResponse({"error": "viaje no válido"}, status=404)

        duplicate_exists = AsistenteIaLead.objects.filter(
            session=session,
            traveler_email=data["traveler_email"],
            matched_trip_id=data["trip_id"],
        ).exists()
        if duplicate_exists:
            return JsonResponse({"error": "lead duplicado"}, status=409)

        intent_data = conversation_manager.get_intent(data["session_token"]) or session.intent_data or {}

        lead = AsistenteIaLead.objects.create(
            company_id=data["company_id"],
            session=session,
            traveler_name=data["traveler_name"],
            traveler_email=data["traveler_email"],
            traveler_msg=data.get("traveler_msg", ""),
            intent_data=intent_data,
            matched_trip_id=data["trip_id"],
            match_score=data["match_score"],
            status="new",
            created_at=timezone.now(),
        )

        lead_notifier.send(lead)

        return JsonResponse({
            "lead_id": str(lead.id),
            "message": "Lead creado correctamente"
        }, status=201)


class LeadStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAgencyAdminPermission]

    def patch(self, request, pk):
        serializer = LeadStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=400)

        company_id = _resolve_admin_company_id(request)
        if not company_id:
            return JsonResponse({"error": "no autorizado"}, status=403)

        lead = AsistenteIaLead.objects.filter(id=pk, company_id=company_id).first()
        if not lead:
            return JsonResponse({"error": "lead no encontrado"}, status=404)

        lead.status = serializer.validated_data["status"]
        lead.save(update_fields=["status"])

        return Response({"id": str(lead.id), "status": lead.status})

    def post(self, request, pk):
        return self.patch(request, pk)


# =========================
# TRIP PLAN — SHARE
# =========================

class SaveTripPlanView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        import secrets
        from .models import AsistenteTripPlan

        session_token = request.data.get("session_token")
        session = AsistenteIaSession.objects.filter(
            session_token=session_token, status="active"
        ).first()

        share_token = secrets.token_hex(8)
        intent = session.intent_data or {} if session else {}

        trip = AsistenteTripPlan.objects.create(
            session=session,
            share_token=share_token,
            title=request.data.get("title", f"Viaje a {intent.get('destination', 'Perú')}"),
            destination=request.data.get("destination") or intent.get("destination", ""),
            days=request.data.get("days") or intent.get("duration", 0),
            travelers=request.data.get("travelers") or intent.get("travelers", 1),
            itinerary=request.data.get("itinerary", []),
            budget=request.data.get("budget"),
            weather=request.data.get("weather"),
            hotels=request.data.get("hotels", []),
        )

        return JsonResponse({
            "trip_id": str(trip.id),
            "share_token": share_token,
            "share_url": f"/trip/{share_token}",
        }, status=201)


class GetTripPlanView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, share_token):
        from .models import AsistenteTripPlan
        trip = AsistenteTripPlan.objects.filter(
            share_token=share_token, is_public=True
        ).first()
        if not trip:
            return JsonResponse({"error": "Trip no encontrado"}, status=404)
        return JsonResponse({
            "trip_id": str(trip.id),
            "title": trip.title,
            "destination": trip.destination,
            "days": trip.days,
            "travelers": trip.travelers,
            "itinerary": trip.itinerary,
            "budget": trip.budget,
            "weather": trip.weather,
            "hotels": trip.hotels,
            "created_at": trip.created_at.isoformat(),
        })




class StatsView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        from .models import AsistenteIaSession, AsistenteIaLead, AsistenteTripPlan
        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)

        # Totales
        total_sessions = AsistenteIaSession.objects.count()
        total_trips = AsistenteTripPlan.objects.count()
        total_leads = AsistenteIaLead.objects.count()

        # Recientes
        sessions_7d = AsistenteIaSession.objects.filter(created_at__gte=last_7d).count()
        trips_7d = AsistenteTripPlan.objects.filter(created_at__gte=last_7d).count()
        sessions_30d = AsistenteIaSession.objects.filter(created_at__gte=last_30d).count()

        # Top destinos
        top_destinations = list(
            AsistenteTripPlan.objects
            .exclude(destination__isnull=True)
            .exclude(destination="")
            .values("destination")
            .annotate(n=Count("id"))
            .order_by("-n")[:10]
        )
        # Filtrar destinations largas (markers del mapa) en Python
        top_destinations = [t for t in top_destinations if len(t["destination"]) < 40][:6]

        # Trips recientes
        recent_trips = []
        for t in AsistenteTripPlan.objects.order_by("-created_at")[:5]:
            budget_total = None
            if t.budget:
                budget_total = t.budget.get("total_soles") or t.budget.get("result", {}).get("total_soles")
            recent_trips.append({
                "title": t.title or f"Viaje a {t.destination}",
                "destination": t.destination,
                "days": t.days,
                "travelers": t.travelers,
                "budget_total": budget_total,
                "share_token": t.share_token,
                "created_at": t.created_at.isoformat(),
            })

        return JsonResponse({
            "totals": {
                "sessions": total_sessions,
                "trips": total_trips,
                "leads": total_leads,
            },
            "recent": {
                "sessions_7d": sessions_7d,
                "sessions_30d": sessions_30d,
                "trips_7d": trips_7d,
            },
            "top_destinations": top_destinations,
            "recent_trips": recent_trips,
        })

class ListTripsView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        from .models import AsistenteTripPlan
        trips = AsistenteTripPlan.objects.filter(
            is_public=True
        ).order_by('-created_at')[:20]
        data = []
        for trip in trips:
            budget_total = None
            if trip.budget:
                budget_total = trip.budget.get("total_soles") or trip.budget.get("result", {}).get("total_soles")
            weather_temp = None
            if trip.weather:
                weather_temp = trip.weather.get("temperature") or trip.weather.get("result", {}).get("temperature")
            data.append({
                "share_token": trip.share_token,
                "title": trip.title or f"Viaje a {trip.destination}",
                "destination": trip.destination,
                "days": trip.days,
                "travelers": trip.travelers,
                "budget_total": budget_total,
                "weather_temp": weather_temp,
                "days_count": len(trip.itinerary) if trip.itinerary else trip.days,
                "created_at": trip.created_at.isoformat(),
            })
        return JsonResponse({"trips": data, "total": len(data)})

class TripPlanPdfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, share_token):
        from .models import AsistenteTripPlan
        from .pdf_generator import generate_trip_pdf
        from django.http import HttpResponse

        trip = AsistenteTripPlan.objects.filter(share_token=share_token).first()
        if not trip:
            return JsonResponse({"error": "Trip no encontrado"}, status=404)

        try:
            pdf_bytes = generate_trip_pdf(trip)
        except Exception as e:
            return JsonResponse({"error": f"Error generando PDF: {e}"}, status=500)

        filename = f"viaje-{trip.destination or 'totem'}-{share_token[:8]}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


# =========================
# SIMPLE LEAD (sin company validation)
# =========================
class SimpleLeadView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LeadRateThrottle]

    def post(self, request):
        data = request.data
        session_token = data.get("session_token", "")
        traveler_name = data.get("traveler_name", "").strip()
        traveler_email = data.get("traveler_email", "").strip()
        traveler_msg = data.get("traveler_msg", "")

        if not session_token or not traveler_name or not traveler_email:
            return JsonResponse({"error": "Faltan campos requeridos"}, status=400)

        session = AsistenteIaSession.objects.filter(
            session_token=session_token,
            status="active"
        ).first()
        if not session:
            return JsonResponse({"error": "Sesión inválida"}, status=400)

        # Usar un UUID fijo como tenant_id hasta que exista multi-tenant real
        DEFAULT_TENANT_ID = "2dceea5b-1628-4261-b831-56af952b4348"  # Empresa Demo

        import uuid as _uuid
        lead_id = _uuid.uuid4()
        intent_data = session.intent_data or {}

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO asistente_ia_leads
                    (id, tenant_id, session_id, traveler_name, traveler_email,
                     traveler_msg, intent_data, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'new', NOW())
            """, [
                str(lead_id),
                DEFAULT_TENANT_ID,
                str(session.id),
                traveler_name,
                traveler_email,
                traveler_msg,
                json.dumps(intent_data),
            ])

        print(f">>> [SimpleLeadView] Lead guardado: {traveler_name} <{traveler_email}>")
        return JsonResponse({"lead_id": str(lead_id)}, status=201)
