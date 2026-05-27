import json
import uuid
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.asistente_ia.views import (
    AgencyLeadDetailView,
    AgencyLeadsListView,
    CreateLeadView,
    CreateSessionView,
    LeadStatusUpdateView,
    MessageView,
    _resolve_admin_company_id,
)
from apps.asistente_ia.ai.parsers.response_parser import IntentResult


def _post(factory, path, data):
    return factory.post(path, data=json.dumps(data), content_type="application/json")


class AsistenteIaFlowApiTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.session_id = uuid.uuid4()
        self.session_token = "a" * 64
        self.company_id = uuid.uuid4()
        self.trip_id = uuid.uuid4()
        self.admin_user = SimpleNamespace(
            is_authenticated=True,
            rol="admin",
            email="admin@agencia.test",
        )

    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_session_message_lead_and_backoffice_flow(self, mock_session_cls, mock_conv):
        # 1) Crear sesión
        created_session = SimpleNamespace(id=self.session_id, session_token=self.session_token)
        mock_session_cls.objects.create.return_value = created_session
        create_session_view = CreateSessionView.as_view()
        request = _post(self.factory, "/api/asistente-ia/sessions/", {"language": "es"})
        with patch.object(CreateSessionView, "throttle_classes", []):
            response = create_session_view(request)
        self.assertEqual(response.status_code, 201)

        # 2) Mensaje SSE
        active_session = SimpleNamespace(
            id=self.session_id,
            session_token=self.session_token,
            status="active",
            language="es",
            expires_at=timezone.now() + timedelta(hours=10),
            intent_data={},
        )
        mock_session_cls.objects.filter.return_value.first.return_value = active_session
        mock_session_cls.objects.filter.return_value.update.return_value = None

        with (
            patch("apps.asistente_ia.views.intent_engine") as mock_intent_engine,
            patch("apps.asistente_ia.views.openrouter_client") as mock_openrouter,
            patch("apps.asistente_ia.views.rag_engine", None),
        ):
            mock_conv.get_messages.return_value = [{"role": "user", "content": "Quiero Cusco 1 semana"}]
            mock_conv.get_language.return_value = "es"
            mock_intent_engine.extract_intent.return_value = IntentResult(
                destination="Cusco",
                duration="1 semana",
                confidence_score=0.9,
                fields_detected=4,
                needs_clarification=False,
            )
            mock_openrouter.generate_response.return_value = iter(["Tengo opciones para ti."])

            message_view = MessageView.as_view()
            request = _post(
                self.factory,
                f"/api/asistente-ia/sessions/{self.session_id}/message/",
                {"session_token": self.session_token, "content": "Cusco 1 semana"},
            )
            with patch.object(MessageView, "throttle_classes", []):
                response = message_view(request, pk=self.session_id)
            self.assertEqual(response.status_code, 200)
            stream_content = b"".join(response.streaming_content).decode("utf-8")
            self.assertIn('"type": "done"', stream_content)

        # 3) Crear lead
        lead_obj = SimpleNamespace(
            id=uuid.uuid4(),
            created_at=timezone.now(),
        )
        with (
            patch("apps.asistente_ia.views.connection") as mock_conn,
            patch("apps.asistente_ia.views.Viaje") as mock_viaje,
            patch("apps.asistente_ia.views.AsistenteIaLead") as mock_lead_cls,
            patch("apps.asistente_ia.views.lead_notifier") as mock_notifier,
        ):
            cursor = MagicMock()
            mock_conn.cursor.return_value.__enter__.return_value = cursor
            cursor.fetchone.return_value = (1,)
            mock_viaje.objects.filter.return_value.exists.return_value = True
            mock_lead_cls.objects.filter.return_value.exists.return_value = False
            mock_lead_cls.objects.create.return_value = lead_obj
            mock_conv.get_intent.return_value = {"destination": "Cusco"}

            create_lead_view = CreateLeadView.as_view()
            request = _post(
                self.factory,
                "/api/asistente-ia/leads/",
                {
                    "session_token": self.session_token,
                    "company_id": str(self.company_id),
                    "trip_id": str(self.trip_id),
                    "match_score": 0.8,
                    "traveler_name": "Ronald",
                    "traveler_email": "ronald@test.com",
                },
            )
            with patch.object(CreateLeadView, "throttle_classes", []):
                response = create_lead_view(request)
            self.assertEqual(response.status_code, 201)
            mock_notifier.send.assert_called_once()

        # 4) Backoffice listado
        list_lead = SimpleNamespace(
            id=uuid.uuid4(),
            company_id=self.company_id,
            traveler_name="Ronald",
            traveler_email="ronald@test.com",
            intent_data={"destination": "Cusco"},
            matched_trip_id=None,
            match_score=0.8,
            status="new",
            created_at=timezone.now(),
        )
        with patch.object(AgencyLeadsListView, "get_queryset", return_value=[list_lead]):
            list_view = AgencyLeadsListView.as_view()
            request = self.factory.get("/api/asistente-ia/agency/leads/?status=new")
            force_authenticate(request, user=self.admin_user)
            response = list_view(request)
            self.assertEqual(response.status_code, 200)
            self.assertIn("results", response.data)

        # 5) Backoffice detalle
        detail_lead = SimpleNamespace(
            id=uuid.uuid4(),
            company_id=self.company_id,
            traveler_name="Ronald",
            traveler_email="ronald@test.com",
            traveler_msg="Necesito opciones en julio",
            intent_data={"destination": "Cusco", "interests": []},
            matched_trip_id=None,
            match_score=0.8,
            status="new",
            created_at=timezone.now(),
            session=SimpleNamespace(pk=self.session_id),
        )
        with patch.object(AgencyLeadDetailView, "get_object", return_value=detail_lead):
            detail_view = AgencyLeadDetailView.as_view()
            request = self.factory.get(f"/api/asistente-ia/agency/leads/{detail_lead.id}/")
            force_authenticate(request, user=self.admin_user)
            response = detail_view(request, pk=detail_lead.id)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["traveler_name"], "Ronald")

        # 6) Backoffice actualizar estado
        status_lead = SimpleNamespace(id=uuid.uuid4(), status="new")
        status_lead.save = MagicMock()
        with (
            patch("apps.asistente_ia.views._resolve_admin_company_id", return_value=str(self.company_id)),
            patch("apps.asistente_ia.views.AsistenteIaLead") as mock_lead_model,
        ):
            mock_lead_model.objects.filter.return_value.first.return_value = status_lead
            update_view = LeadStatusUpdateView.as_view()
            request = self.factory.patch(
                f"/api/asistente-ia/agency/leads/{status_lead.id}/status/",
                data=json.dumps({"status": "contacted"}),
                content_type="application/json",
            )
            force_authenticate(request, user=self.admin_user)
            response = update_view(request, pk=status_lead.id)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["status"], "contacted")


class AsistenteIaRateLimitApiTest(TestCase):
    def setUp(self):
        cache.clear()
        self.factory = APIRequestFactory()
        self.session_id = uuid.uuid4()
        self.session_token = "b" * 64

    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.intent_engine")
    @patch("apps.asistente_ia.views.openrouter_client")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_messages_rate_limit_hits_429_on_request_11(
        self,
        mock_session_cls,
        mock_openrouter,
        mock_intent_engine,
        mock_conv,
    ):
        active_session = SimpleNamespace(
            id=self.session_id,
            session_token=self.session_token,
            status="active",
            language="es",
            expires_at=timezone.now() + timedelta(hours=10),
            intent_data={},
        )
        mock_session_cls.objects.filter.return_value.first.return_value = active_session
        mock_session_cls.objects.filter.return_value.update.return_value = None
        mock_conv.get_messages.return_value = [{"role": "user", "content": "hola"}]
        mock_conv.get_language.return_value = "es"
        mock_intent_engine.extract_intent.return_value = IntentResult(
            confidence_score=0.9,
            fields_detected=3,
            needs_clarification=False,
        )
        mock_openrouter.generate_response.return_value = iter(["ok"])

        view = MessageView.as_view()
        responses = []
        for _ in range(11):
            request = _post(
                self.factory,
                f"/api/asistente-ia/sessions/{self.session_id}/message/",
                {"session_token": self.session_token, "content": "hola"},
            )
            request.META["REMOTE_ADDR"] = "10.0.0.55"
            responses.append(view(request, pk=self.session_id))

        last_response = responses[-1]
        self.assertEqual(last_response.status_code, 429)
        self.assertIn("Retry-After", last_response.headers)


class AsistenteIaOwnershipResolutionTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch("apps.asistente_ia.views.connection")
    def test_admin_ignores_header_company_override(self, mock_conn):
        resolved_company_id = uuid.uuid4()
        forged_company_id = uuid.uuid4()
        request = self.factory.get(
            "/api/asistente-ia/agency/leads/",
            HTTP_X_COMPANY_ID=str(forged_company_id),
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            rol="admin",
            email="admin@agencia.test",
        )

        cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = cursor
        cursor.fetchone.return_value = (resolved_company_id,)

        resolved = _resolve_admin_company_id(request)
        self.assertEqual(resolved, str(resolved_company_id))

    def test_superadmin_can_override_company_context(self):
        override_company_id = uuid.uuid4()
        request = self.factory.get(
            f"/api/asistente-ia/agency/leads/?company_id={override_company_id}"
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            rol="superadmin",
            email="root@totem.test",
        )

        resolved = _resolve_admin_company_id(request)
        self.assertEqual(resolved, str(override_company_id))
