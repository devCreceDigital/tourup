"""Tests adicionales para cubrir ramas no alcanzadas en intent_engine.py."""
import json
from unittest.mock import patch
from django.test import TestCase
from apps.asistente_ia.ai.parsers.response_parser import IntentEngine, IntentResult


class IntentEngineExtraTest(TestCase):
    def setUp(self):
        self.engine = IntentEngine()

    # ── extract_intent error paths ────────────────────────────────────────────

    @patch("apps.asistente_ia.ai.parsers.response_parser.openrouter_client")
    def test_none_response_triggers_default_clarification(self, mock_or):
        """Line 83: openrouter returns None → fallback IntentResult."""
        mock_or.extract_intent.return_value = None

        result = self.engine.extract_intent([{"role": "user", "content": "Hi"}], "es")

        self.assertTrue(result.needs_clarification)
        self.assertEqual(result.confidence_score, 0.0)
        self.assertIsNotNone(result.clarification_question)

    @patch("apps.asistente_ia.ai.parsers.response_parser.openrouter_client")
    def test_invalid_json_triggers_fallback(self, mock_or):
        """Lines 117-119: JSON decode error → fallback IntentResult."""
        mock_or.extract_intent.return_value = "not-valid-json{"

        result = self.engine.extract_intent([{"role": "user", "content": "Hi"}], "es")

        self.assertTrue(result.needs_clarification)
        self.assertEqual(result.confidence_score, 0.0)
        self.assertEqual(result.fields_detected, 0)

    @patch("apps.asistente_ia.ai.parsers.response_parser.openrouter_client")
    def test_low_confidence_with_no_question_generates_one(self, mock_or):
        """Line 113: confidence < min but LLM provided no clarification_question."""
        mock_or.extract_intent.return_value = json.dumps({
            "destination": "Peru",
            "duration": None,
            "group_type": None,
            "group_size": None,
            "budget_range": None,
            "interests": [],
            "departure_month": None,
            "confidence_score": 0.4,
            "fields_detected": 1,
            "needs_clarification": False,
            "clarification_question": None,
        })

        result = self.engine.extract_intent([{"role": "user", "content": "Peru"}], "es")

        self.assertTrue(result.needs_clarification)
        self.assertIsNotNone(result.clarification_question)

    @patch("apps.asistente_ia.ai.parsers.response_parser.openrouter_client")
    def test_none_response_in_english_uses_english_fallback(self, mock_or):
        """_get_default_clarification called with 'en'."""
        mock_or.extract_intent.return_value = None

        result = self.engine.extract_intent([{"role": "user", "content": "Hi"}], "en")

        self.assertTrue(result.needs_clarification)
        self.assertIn("trip", result.clarification_question.lower())

    @patch("apps.asistente_ia.ai.parsers.response_parser.openrouter_client")
    def test_none_response_in_pt_uses_portuguese_fallback(self, mock_or):
        mock_or.extract_intent.return_value = None

        result = self.engine.extract_intent([{"role": "user", "content": "Oi"}], "pt")

        self.assertIn("viagem", result.clarification_question.lower())

    # ── _build_conversation_context ───────────────────────────────────────────

    def test_context_formats_user_and_assistant_roles(self):
        messages = [
            {"role": "user", "content": "Hola"},
            {"role": "assistant", "content": "¿En qué te ayudo?"},
        ]
        ctx = self.engine._build_conversation_context(messages)
        self.assertIn("USER", ctx)
        self.assertIn("ASSISTANT", ctx)
        self.assertIn("Hola", ctx)

    def test_context_uses_only_last_10_messages(self):
        messages = [{"role": "user", "content": f"Mensaje {i}"} for i in range(15)]
        ctx = self.engine._build_conversation_context(messages)
        self.assertIn("Mensaje 14", ctx)
        self.assertNotIn("Mensaje 4", ctx)

    def test_context_empty_messages_returns_empty_string(self):
        self.assertEqual(self.engine._build_conversation_context([]), "")

    # ── _generate_clarification_question ──────────────────────────────────────

    def test_asks_destination_when_all_fields_missing(self):
        result = IntentResult(needs_clarification=True, confidence_score=0.3, fields_detected=0)
        q = self.engine._generate_clarification_question(result, "es")
        self.assertIn("destino", q.lower())

    def test_asks_duration_when_destination_is_set(self):
        result = IntentResult(
            destination="Peru",
            needs_clarification=True, confidence_score=0.4, fields_detected=1,
        )
        q = self.engine._generate_clarification_question(result, "es")
        self.assertIn("tiempo", q.lower())

    def test_asks_group_type_when_destination_and_duration_set(self):
        result = IntentResult(
            destination="Peru", duration="10 días",
            needs_clarification=True, confidence_score=0.5, fields_detected=2,
        )
        q = self.engine._generate_clarification_question(result, "es")
        self.assertIsNotNone(q)

    def test_clarification_in_english(self):
        result = IntentResult(needs_clarification=True, confidence_score=0.2, fields_detected=0)
        q = self.engine._generate_clarification_question(result, "en")
        self.assertIn("Where", q)

    def test_clarification_in_portuguese(self):
        result = IntentResult(needs_clarification=True, confidence_score=0.2, fields_detected=0)
        q = self.engine._generate_clarification_question(result, "pt")
        self.assertIn("viajar", q)

    def test_clarification_unknown_language_falls_back_to_es(self):
        result = IntentResult(needs_clarification=True, confidence_score=0.2, fields_detected=0)
        q = self.engine._generate_clarification_question(result, "fr")
        self.assertIsNotNone(q)
        self.assertGreater(len(q), 0)

    def test_all_fields_present_returns_destination_question(self):
        """When no field is missing the loop skips → default destination question."""
        result = IntentResult(
            destination="Peru", duration="10 días", group_type="familiar",
            group_size=4, budget_range="mid-range", interests=["cultura"],
            departure_month="julio", confidence_score=0.95, fields_detected=7,
            needs_clarification=False,
        )
        q = self.engine._generate_clarification_question(result, "es")
        self.assertIn("destino", q.lower())

    # ── _get_default_clarification ────────────────────────────────────────────

    def test_default_clarification_es(self):
        q = self.engine._get_default_clarification("es")
        self.assertIn("viaje", q.lower())

    def test_default_clarification_en(self):
        q = self.engine._get_default_clarification("en")
        self.assertIn("trip", q.lower())

    def test_default_clarification_pt(self):
        q = self.engine._get_default_clarification("pt")
        self.assertIn("viagem", q.lower())

    def test_default_clarification_unknown_falls_back_to_es(self):
        q = self.engine._get_default_clarification("zh")
        self.assertIsNotNone(q)
        self.assertGreater(len(q), 0)
