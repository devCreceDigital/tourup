import uuid
from django.test import TestCase
from apps.asistente_ia.serializers import (
    CreateSessionSerializer,
    SendMessageSerializer,
    CreateLeadSerializer,
    LeadStatusUpdateSerializer,
)


class CreateSessionSerializerTest(TestCase):
    def test_default_language_is_es(self):
        s = CreateSessionSerializer(data={})
        self.assertTrue(s.is_valid(), s.errors)
        self.assertEqual(s.validated_data.get("language", "es"), "es")

    def test_valid_language_es(self):
        s = CreateSessionSerializer(data={"language": "es"})
        self.assertTrue(s.is_valid())

    def test_valid_language_en(self):
        s = CreateSessionSerializer(data={"language": "en"})
        self.assertTrue(s.is_valid())

    def test_valid_language_pt(self):
        s = CreateSessionSerializer(data={"language": "pt"})
        self.assertTrue(s.is_valid())

    def test_invalid_language_fr(self):
        s = CreateSessionSerializer(data={"language": "fr"})
        self.assertFalse(s.is_valid())
        self.assertIn("language", s.errors)

    def test_invalid_language_empty(self):
        s = CreateSessionSerializer(data={"language": ""})
        self.assertFalse(s.is_valid())


class SendMessageSerializerTest(TestCase):
    VALID_TOKEN = "a" * 64

    def test_valid_data(self):
        s = SendMessageSerializer(data={"session_token": self.VALID_TOKEN, "content": "Hola"})
        self.assertTrue(s.is_valid(), s.errors)

    def test_token_too_short(self):
        s = SendMessageSerializer(data={"session_token": "a" * 63, "content": "Hi"})
        self.assertFalse(s.is_valid())

    def test_token_too_long(self):
        s = SendMessageSerializer(data={"session_token": "a" * 65, "content": "Hi"})
        self.assertFalse(s.is_valid())

    def test_token_uppercase_rejected(self):
        s = SendMessageSerializer(data={"session_token": "A" * 64, "content": "Hi"})
        self.assertFalse(s.is_valid())

    def test_content_max_length(self):
        s = SendMessageSerializer(data={"session_token": self.VALID_TOKEN, "content": "x" * 1000})
        self.assertTrue(s.is_valid())

    def test_content_too_long(self):
        s = SendMessageSerializer(data={"session_token": self.VALID_TOKEN, "content": "x" * 1001})
        self.assertFalse(s.is_valid())

    def test_missing_content(self):
        s = SendMessageSerializer(data={"session_token": self.VALID_TOKEN})
        self.assertFalse(s.is_valid())
        self.assertIn("content", s.errors)

    def test_missing_token(self):
        s = SendMessageSerializer(data={"content": "Hello"})
        self.assertFalse(s.is_valid())
        self.assertIn("session_token", s.errors)


class CreateLeadSerializerTest(TestCase):
    VALID_TOKEN = "b" * 64

    def setUp(self):
        self.valid_data = {
            "session_token": self.VALID_TOKEN,
            "company_id": str(uuid.uuid4()),
            "trip_id": str(uuid.uuid4()),
            "match_score": 0.85,
            "traveler_name": "Juan Pérez",
            "traveler_email": "juan@example.com",
        }

    def test_valid_data(self):
        s = CreateLeadSerializer(data=self.valid_data)
        self.assertTrue(s.is_valid(), s.errors)

    def test_optional_traveler_msg(self):
        data = {**self.valid_data, "traveler_msg": "Mensaje adicional"}
        s = CreateLeadSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_blank_traveler_msg_allowed(self):
        data = {**self.valid_data, "traveler_msg": ""}
        s = CreateLeadSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_invalid_email(self):
        data = {**self.valid_data, "traveler_email": "not-an-email"}
        s = CreateLeadSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("traveler_email", s.errors)

    def test_match_score_above_max(self):
        data = {**self.valid_data, "match_score": 1.5}
        s = CreateLeadSerializer(data=data)
        self.assertFalse(s.is_valid())

    def test_match_score_below_min(self):
        data = {**self.valid_data, "match_score": -0.1}
        s = CreateLeadSerializer(data=data)
        self.assertFalse(s.is_valid())

    def test_match_score_zero_valid(self):
        data = {**self.valid_data, "match_score": 0.0}
        s = CreateLeadSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_match_score_one_valid(self):
        data = {**self.valid_data, "match_score": 1.0}
        s = CreateLeadSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_invalid_company_id(self):
        data = {**self.valid_data, "company_id": "not-a-uuid"}
        s = CreateLeadSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("company_id", s.errors)

    def test_invalid_trip_id(self):
        data = {**self.valid_data, "trip_id": "not-a-uuid"}
        s = CreateLeadSerializer(data=data)
        self.assertFalse(s.is_valid())

    def test_missing_traveler_name(self):
        data = dict(self.valid_data)
        del data["traveler_name"]
        s = CreateLeadSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("traveler_name", s.errors)

    def test_missing_match_score(self):
        data = dict(self.valid_data)
        del data["match_score"]
        s = CreateLeadSerializer(data=data)
        self.assertFalse(s.is_valid())


class LeadStatusUpdateSerializerTest(TestCase):
    def test_valid_new(self):
        s = LeadStatusUpdateSerializer(data={"status": "new"})
        self.assertTrue(s.is_valid())

    def test_valid_contacted(self):
        s = LeadStatusUpdateSerializer(data={"status": "contacted"})
        self.assertTrue(s.is_valid())

    def test_valid_converted(self):
        s = LeadStatusUpdateSerializer(data={"status": "converted"})
        self.assertTrue(s.is_valid())

    def test_valid_closed(self):
        s = LeadStatusUpdateSerializer(data={"status": "closed"})
        self.assertTrue(s.is_valid())

    def test_invalid_status(self):
        s = LeadStatusUpdateSerializer(data={"status": "unknown"})
        self.assertFalse(s.is_valid())
        self.assertIn("status", s.errors)

    def test_missing_status(self):
        s = LeadStatusUpdateSerializer(data={})
        self.assertFalse(s.is_valid())
