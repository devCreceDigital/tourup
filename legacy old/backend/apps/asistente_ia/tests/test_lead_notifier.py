import json
from unittest.mock import MagicMock, patch
from django.test import TestCase
from apps.asistente_ia.ai.tools.lead_notifier import LeadNotifier


def _make_lead(name="Juan García", email="juan@example.com", msg="Hola"):
    lead = MagicMock()
    lead.company_id = "company-uuid-test"
    lead.matched_trip_id = "trip-uuid-test"
    lead.traveler_name = name
    lead.traveler_email = email
    lead.traveler_msg = msg
    lead.match_score = 0.85
    lead.intent_data = {"destination": "Peru", "confidence_score": 0.9}
    return lead


def _make_notifier(api_key="test-api-key"):
    notifier = LeadNotifier.__new__(LeadNotifier)
    notifier.api_key = api_key
    notifier.from_email = "noreply@totemhub.com"
    return notifier


class GetCompanyAdminEmailTest(TestCase):
    @patch("apps.asistente_ia.ai.tools.lead_notifier.connection")
    def test_returns_email_when_found(self, mock_conn):
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchone.return_value = ("admin@agency.com",)

        result = _make_notifier()._get_company_admin_email("some-uuid")
        self.assertEqual(result, "admin@agency.com")

    @patch("apps.asistente_ia.ai.tools.lead_notifier.connection")
    def test_returns_none_when_not_found(self, mock_conn):
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchone.return_value = None

        result = _make_notifier()._get_company_admin_email("missing-uuid")
        self.assertIsNone(result)


class BuildHtmlTest(TestCase):
    def test_contains_traveler_name_and_email(self):
        lead = _make_lead(name="Ana Pérez", email="ana@example.com")
        html = _make_notifier()._build_html(lead)
        self.assertIn("Ana Pérez", html)
        self.assertIn("ana@example.com", html)

    def test_contains_intent_data(self):
        lead = _make_lead()
        lead.intent_data = {"destination": "Bali"}
        html = _make_notifier()._build_html(lead)
        self.assertIn("Bali", html)

    def test_no_trip_shows_placeholder(self):
        lead = _make_lead()
        lead.matched_trip_id = None
        lead.intent_data = {}
        html = _make_notifier()._build_html(lead)
        self.assertIn("No especificado", html)

    def test_no_message_shows_placeholder(self):
        lead = _make_lead()
        lead.traveler_msg = None
        lead.intent_data = {}
        html = _make_notifier()._build_html(lead)
        self.assertIn("Sin mensaje adicional", html)

    def test_match_score_displayed(self):
        lead = _make_lead()
        lead.intent_data = {}
        html = _make_notifier()._build_html(lead)
        self.assertIn("0.85", str(html))


class SendTest(TestCase):
    @patch("apps.asistente_ia.ai.tools.lead_notifier.connection")
    def test_returns_false_when_no_admin_email(self, mock_conn):
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchone.return_value = None

        self.assertFalse(_make_notifier().send(_make_lead()))

    @patch("apps.asistente_ia.ai.tools.lead_notifier.connection")
    def test_returns_false_when_no_api_key(self, mock_conn):
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchone.return_value = ("admin@agency.com",)

        self.assertFalse(_make_notifier(api_key="").send(_make_lead()))

    @patch("apps.asistente_ia.ai.tools.lead_notifier.urllib_request.urlopen")
    @patch("apps.asistente_ia.ai.tools.lead_notifier.connection")
    def test_returns_true_on_success(self, mock_conn, mock_urlopen):
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchone.return_value = ("admin@agency.com",)
        mock_urlopen.return_value.__enter__ = lambda s: MagicMock()
        mock_urlopen.return_value.__exit__ = MagicMock(return_value=False)

        self.assertTrue(_make_notifier().send(_make_lead()))

    @patch("apps.asistente_ia.ai.tools.lead_notifier.urllib_request.urlopen")
    @patch("apps.asistente_ia.ai.tools.lead_notifier.connection")
    def test_returns_false_on_http_error(self, mock_conn, mock_urlopen):
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchone.return_value = ("admin@agency.com",)
        mock_urlopen.side_effect = Exception("Connection refused")

        self.assertFalse(_make_notifier().send(_make_lead()))

    @patch("apps.asistente_ia.ai.tools.lead_notifier.urllib_request.urlopen")
    @patch("apps.asistente_ia.ai.tools.lead_notifier.connection")
    def test_payload_contains_correct_recipient(self, mock_conn, mock_urlopen):
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_cursor.fetchone.return_value = ("admin@agency.com",)
        mock_urlopen.return_value.__enter__ = lambda s: MagicMock()
        mock_urlopen.return_value.__exit__ = MagicMock(return_value=False)

        _make_notifier().send(_make_lead(name="Carlos"))

        req = mock_urlopen.call_args[0][0]
        payload = json.loads(req.data.decode())
        self.assertEqual(payload["to"], ["admin@agency.com"])
        self.assertIn("Carlos", payload["subject"])
