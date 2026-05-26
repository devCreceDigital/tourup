import json
import uuid
from datetime import timedelta
from unittest.mock import MagicMock, patch
from django.test import TestCase, RequestFactory
from django.utils import timezone

from apps.asistente_ia.views import (
    CreateSessionView,
    MessageView,
    CreateLeadView,
    _sse_payload,
)
from apps.asistente_ia.ai.parsers.response_parser import IntentResult

TOKEN_SESSION = "c" * 64
TOKEN_LEAD = "d" * 64


def _future():
    return timezone.now() + timedelta(hours=23)


def _past():
    return timezone.now() - timedelta(hours=1)


def _post(factory, url, data):
    return factory.post(url, data=json.dumps(data), content_type="application/json")


# ── _sse_payload ──────────────────────────────────────────────────────────────

class SSEPayloadTest(TestCase):
    def test_starts_with_data_prefix(self):
        self.assertTrue(_sse_payload({"type": "done"}).startswith("data: "))

    def test_ends_with_double_newline(self):
        self.assertTrue(_sse_payload({"type": "done"}).endswith("\n\n"))

    def test_encodes_json_body(self):
        inner = _sse_payload({"type": "token", "content": "Hola"})[len("data: "):-2]
        parsed = json.loads(inner)
        self.assertEqual(parsed["content"], "Hola")

    def test_preserves_unicode(self):
        self.assertIn("¿Cómo estás?", _sse_payload({"msg": "¿Cómo estás?"}))


# ── CreateSessionView ─────────────────────────────────────────────────────────

class CreateSessionViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.view = CreateSessionView.as_view()

    def _call(self, data):
        request = _post(self.factory, "/api/asistente-ia/sessions/", data)
        with patch.object(CreateSessionView, "throttle_classes", []):
            return self.view(request)

    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_valid_language_returns_201(self, mock_cls, mock_conv):
        s = MagicMock()
        s.id = uuid.uuid4()
        s.session_token = TOKEN_SESSION
        mock_cls.objects.create.return_value = s

        response = self._call({"language": "es"})

        self.assertEqual(response.status_code, 201)
        body = json.loads(response.content)
        self.assertIn("session_token", body)
        self.assertIn("welcome_message", body)
        self.assertIn("expires_at", body)

    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_empty_body_defaults_to_es(self, mock_cls, mock_conv):
        s = MagicMock()
        s.id = uuid.uuid4()
        s.session_token = TOKEN_SESSION
        mock_cls.objects.create.return_value = s

        response = self._call({})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(json.loads(response.content)["language"], "es")

    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_language_pt_accepted(self, mock_cls, mock_conv):
        s = MagicMock()
        s.id = uuid.uuid4()
        s.session_token = TOKEN_SESSION
        mock_cls.objects.create.return_value = s
        self.assertEqual(self._call({"language": "pt"}).status_code, 201)

    def test_invalid_language_returns_400(self):
        self.assertEqual(self._call({"language": "fr"}).status_code, 400)

    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_conversation_manager_initialized(self, mock_cls, mock_conv):
        s = MagicMock()
        s.id = uuid.uuid4()
        s.session_token = TOKEN_SESSION
        mock_cls.objects.create.return_value = s

        self._call({"language": "en"})

        mock_conv.add_message.assert_called_once()
        mock_conv.set_language.assert_called_once()


# ── MessageView ───────────────────────────────────────────────────────────────

class MessageViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.view = MessageView.as_view()
        self.pk = uuid.uuid4()

    def _call(self, data):
        request = _post(self.factory, f"/api/asistente-ia/sessions/{self.pk}/message/", data)
        with patch.object(MessageView, "throttle_classes", []):
            return self.view(request, pk=self.pk)

    def _active_session(self):
        s = MagicMock()
        s.id = self.pk
        s.session_token = TOKEN_SESSION
        s.language = "es"
        s.expires_at = _future()
        return s

    def test_bad_token_format_returns_400(self):
        self.assertEqual(self._call({"session_token": "bad", "content": "Hi"}).status_code, 400)

    def test_missing_content_returns_400(self):
        self.assertEqual(self._call({"session_token": TOKEN_SESSION}).status_code, 400)

    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_session_not_found_returns_400(self, mock_cls):
        mock_cls.objects.filter.return_value.first.return_value = None
        self.assertEqual(self._call({"session_token": TOKEN_SESSION, "content": "Hi"}).status_code, 400)

    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_expired_session_returns_400(self, mock_cls):
        s = self._active_session()
        s.expires_at = _past()
        mock_cls.objects.filter.return_value.first.return_value = s
        self.assertEqual(self._call({"session_token": TOKEN_SESSION, "content": "Hi"}).status_code, 400)

    @patch("apps.asistente_ia.views.AsistenteIaSession")
    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.intent_engine")
    @patch("apps.asistente_ia.views.openrouter_client")
    @patch("apps.asistente_ia.views.rag_engine", None)
    def test_clarification_event_in_stream(self, mock_or, mock_ie, mock_conv, mock_cls):
        mock_cls.objects.filter.return_value.first.return_value = self._active_session()
        mock_cls.objects.filter.return_value.update.return_value = None
        mock_conv.get_messages.return_value = [{"role": "user", "content": "Hola"}]
        mock_conv.get_language.return_value = "es"

        intent = IntentResult(
            needs_clarification=True,
            clarification_question="¿A dónde quieres ir?",
            confidence_score=0.3,
            fields_detected=1,
        )
        mock_ie.extract_intent.return_value = intent

        response = self._call({"session_token": TOKEN_SESSION, "content": "Hola"})

        self.assertEqual(response.status_code, 200)
        content = b"".join(response.streaming_content).decode()
        self.assertIn("clarification", content)
        self.assertIn("done", content)

    @patch("apps.asistente_ia.views.AsistenteIaSession")
    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.intent_engine")
    @patch("apps.asistente_ia.views.openrouter_client")
    @patch("apps.asistente_ia.views.rag_engine", None)
    def test_token_event_when_no_clarification(self, mock_or, mock_ie, mock_conv, mock_cls):
        mock_cls.objects.filter.return_value.first.return_value = self._active_session()
        mock_cls.objects.filter.return_value.update.return_value = None
        mock_conv.get_messages.return_value = [{"role": "user", "content": "Perú 10 días familia"}]
        mock_conv.get_language.return_value = "es"

        intent = IntentResult(
            needs_clarification=False,
            confidence_score=0.85,
            fields_detected=5,
        )
        mock_ie.extract_intent.return_value = intent
        mock_or.generate_response.return_value = iter(["Aquí hay opciones"])

        response = self._call({"session_token": TOKEN_SESSION, "content": "Perú 10 días"})
        content = b"".join(response.streaming_content).decode()
        self.assertIn("token", content)

    @patch("apps.asistente_ia.views.AsistenteIaSession")
    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.intent_engine")
    @patch("apps.asistente_ia.views.openrouter_client")
    @patch("apps.asistente_ia.views.rag_engine", None)
    def test_exception_in_stream_yields_error_event(self, mock_or, mock_ie, mock_conv, mock_cls):
        # The except block is INSIDE event_stream(), so the failure must happen
        # inside the generator (after intent extraction). We make save_intent raise.
        mock_cls.objects.filter.return_value.first.return_value = self._active_session()
        mock_conv.get_messages.return_value = []
        mock_conv.get_language.return_value = "es"

        intent = IntentResult(
            needs_clarification=False,
            confidence_score=0.85,
            fields_detected=5,
        )
        mock_ie.extract_intent.return_value = intent
        mock_or.generate_response.return_value = iter([])
        mock_conv.save_intent.side_effect = Exception("Redis down")

        response = self._call({"session_token": TOKEN_SESSION, "content": "Hola"})
        content = b"".join(response.streaming_content).decode()
        self.assertIn("error", content)


# ── CreateLeadView ────────────────────────────────────────────────────────────

class CreateLeadViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.view = CreateLeadView.as_view()
        self.valid_data = {
            "session_token": TOKEN_LEAD,
            "company_id": str(uuid.uuid4()),
            "trip_id": str(uuid.uuid4()),
            "match_score": 0.85,
            "traveler_name": "Juan",
            "traveler_email": "juan@example.com",
        }

    def _call(self, data):
        request = _post(self.factory, "/api/asistente-ia/leads/", data)
        with patch.object(CreateLeadView, "throttle_classes", []):
            return self.view(request)

    def _mock_conn(self, mock_conn, found=True):
        cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        cursor.fetchone.return_value = (1,) if found else None
        return cursor

    def test_invalid_payload_returns_400(self):
        self.assertEqual(self._call({"session_token": "bad"}).status_code, 400)

    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_missing_session_returns_400(self, mock_cls):
        mock_cls.objects.filter.return_value.first.return_value = None
        self.assertEqual(self._call(self.valid_data).status_code, 400)

    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_expired_session_returns_400(self, mock_cls):
        s = MagicMock()
        s.expires_at = _past()
        mock_cls.objects.filter.return_value.first.return_value = s
        self.assertEqual(self._call(self.valid_data).status_code, 400)

    @patch("apps.asistente_ia.views.connection")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_company_not_found_returns_404(self, mock_cls, mock_conn):
        s = MagicMock()
        s.expires_at = _future()
        mock_cls.objects.filter.return_value.first.return_value = s
        self._mock_conn(mock_conn, found=False)
        self.assertEqual(self._call(self.valid_data).status_code, 404)

    @patch("apps.asistente_ia.views.Viaje")
    @patch("apps.asistente_ia.views.connection")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_trip_not_found_returns_404(self, mock_cls, mock_conn, mock_viaje):
        s = MagicMock()
        s.expires_at = _future()
        mock_cls.objects.filter.return_value.first.return_value = s
        self._mock_conn(mock_conn, found=True)
        mock_viaje.objects.filter.return_value.exists.return_value = False
        self.assertEqual(self._call(self.valid_data).status_code, 404)

    @patch("apps.asistente_ia.views.AsistenteIaLead")
    @patch("apps.asistente_ia.views.Viaje")
    @patch("apps.asistente_ia.views.connection")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_duplicate_lead_returns_409(self, mock_cls, mock_conn, mock_viaje, mock_lead_cls):
        s = MagicMock()
        s.expires_at = _future()
        mock_cls.objects.filter.return_value.first.return_value = s
        self._mock_conn(mock_conn, found=True)
        mock_viaje.objects.filter.return_value.exists.return_value = True
        mock_lead_cls.objects.filter.return_value.exists.return_value = True
        self.assertEqual(self._call(self.valid_data).status_code, 409)

    @patch("apps.asistente_ia.views.lead_notifier")
    @patch("apps.asistente_ia.views.conversation_manager")
    @patch("apps.asistente_ia.views.AsistenteIaLead")
    @patch("apps.asistente_ia.views.Viaje")
    @patch("apps.asistente_ia.views.connection")
    @patch("apps.asistente_ia.views.AsistenteIaSession")
    def test_success_returns_201_and_calls_notifier(
        self, mock_cls, mock_conn, mock_viaje, mock_lead_cls, mock_conv, mock_notifier
    ):
        s = MagicMock()
        s.session_token = TOKEN_LEAD
        s.expires_at = _future()
        s.intent_data = {}
        mock_cls.objects.filter.return_value.first.return_value = s
        self._mock_conn(mock_conn, found=True)
        mock_viaje.objects.filter.return_value.exists.return_value = True
        mock_lead_cls.objects.filter.return_value.exists.return_value = False

        lead = MagicMock()
        lead.id = uuid.uuid4()
        lead.created_at = timezone.now()
        mock_lead_cls.objects.create.return_value = lead
        mock_conv.get_intent.return_value = {}

        response = self._call(self.valid_data)

        self.assertEqual(response.status_code, 201)
        body = json.loads(response.content)
        self.assertIn("lead_id", body)
        self.assertIn("message", body)
        mock_notifier.send.assert_called_once_with(lead)
