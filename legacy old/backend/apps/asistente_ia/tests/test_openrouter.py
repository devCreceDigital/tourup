import json
from unittest.mock import MagicMock, patch
from django.test import TestCase
from apps.asistente_ia.ai.llm.openrouter_client import OpenRouterClient


def _make_client(mock_openai=None):
    """Cliente con OpenAI mockeado, sin llamadas reales a la API."""
    client = OpenRouterClient.__new__(OpenRouterClient)
    client.client = mock_openai or MagicMock()
    client.INTENT_MODEL = "openai/gpt-4o-mini"
    client.CHAT_MODEL = "openai/gpt-4o-mini"
    client.EMBEDDING_MODEL = "openai/text-embedding-3-small"
    return client


class InitTest(TestCase):
    @patch("apps.asistente_ia.ai.llm.openrouter_client.os.getenv", return_value=None)
    def test_no_api_key_sets_client_to_none(self, _):
        c = OpenRouterClient()
        self.assertIsNone(c.client)

    @patch("apps.asistente_ia.ai.llm.openrouter_client.OpenAI")
    @patch("apps.asistente_ia.ai.llm.openrouter_client.os.getenv", return_value="sk-test")
    def test_with_api_key_creates_client(self, _, mock_openai_cls):
        c = OpenRouterClient()
        mock_openai_cls.assert_called_once()
        self.assertIsNotNone(c.client)


class ExtractIntentTest(TestCase):
    def test_mock_mode_returns_valid_json(self):
        client = _make_client()
        client.client = None  # force mock mode

        result = client.extract_intent([{"role": "user", "content": "Hi"}], "es")

        parsed = json.loads(result)
        self.assertIn("confidence_score", parsed)
        self.assertTrue(parsed["needs_clarification"])

    def test_returns_content_from_api(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        expected = {"destination": "Peru", "confidence_score": 0.9,
                    "fields_detected": 5, "needs_clarification": False}
        mock_ai.chat.completions.create.return_value.choices[0].message.content = json.dumps(expected)

        result = client.extract_intent([{"role": "user", "content": "Quiero ir a Peru"}], "es")

        self.assertIsNotNone(result)
        self.assertEqual(json.loads(result)["destination"], "Peru")

    def test_api_exception_returns_none(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.side_effect = Exception("timeout")

        result = client.extract_intent([{"role": "user", "content": "Hi"}], "es")
        self.assertIsNone(result)

    def test_json_object_response_format_requested(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.return_value.choices[0].message.content = json.dumps({
            "confidence_score": 0.5, "fields_detected": 0, "needs_clarification": True
        })

        client.extract_intent([{"role": "user", "content": "Hello"}], "en")

        call_kwargs = mock_ai.chat.completions.create.call_args[1]
        self.assertEqual(call_kwargs["response_format"], {"type": "json_object"})


class GenerateResponseTest(TestCase):
    def test_yields_chunks(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        chunk1 = MagicMock()
        chunk1.choices[0].delta.content = "Hola"
        chunk2 = MagicMock()
        chunk2.choices[0].delta.content = " mundo"
        mock_ai.chat.completions.create.return_value = iter([chunk1, chunk2])

        result = list(client.generate_response(
            messages=[{"role": "user", "content": "Hi"}], language="es"
        ))
        self.assertIn("Hola", result)
        self.assertIn(" mundo", result)

    def test_skips_none_chunks(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        chunk_none = MagicMock()
        chunk_none.choices[0].delta.content = None
        chunk_ok = MagicMock()
        chunk_ok.choices[0].delta.content = "Texto"
        mock_ai.chat.completions.create.return_value = iter([chunk_none, chunk_ok])

        result = list(client.generate_response(
            messages=[{"role": "user", "content": "Hi"}], language="es"
        ))
        self.assertNotIn(None, result)
        self.assertIn("Texto", result)

    def test_api_exception_yields_error_message(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.side_effect = Exception("API down")

        result = list(client.generate_response(
            messages=[{"role": "user", "content": "Hi"}], language="es"
        ))
        combined = "".join(result)
        self.assertTrue("error" in combined.lower() or "Lo siento" in combined)

    def test_matches_context_included_in_system_prompt(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.return_value = iter([])

        list(client.generate_response(
            messages=[{"role": "user", "content": "Hi"}],
            matches=[{"trip_id": "t1", "name": "Viaje Cusco"}],
            language="es",
        ))

        messages_sent = mock_ai.chat.completions.create.call_args[1]["messages"]
        system_content = messages_sent[0]["content"]
        self.assertIn("CONTEXTO", system_content)

    def test_streaming_enabled(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.return_value = iter([])

        list(client.generate_response(
            messages=[{"role": "user", "content": "Hi"}], language="es"
        ))

        call_kwargs = mock_ai.chat.completions.create.call_args[1]
        self.assertTrue(call_kwargs.get("stream", False))


class GenerateEmbeddingTest(TestCase):
    def test_returns_embedding_vector(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.embeddings.create.return_value.data[0].embedding = [0.1, 0.2, 0.3]

        result = client.generate_embedding("Hello world")
        self.assertEqual(result, [0.1, 0.2, 0.3])

    def test_exception_returns_none(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.embeddings.create.side_effect = Exception("error")

        self.assertIsNone(client.generate_embedding("Hello"))


class DetectLanguageTest(TestCase):
    def test_detects_es(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.return_value.choices[0].message.content = "es"
        self.assertEqual(client.detect_language("Hola mundo"), "es")

    def test_detects_en(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.return_value.choices[0].message.content = "en"
        self.assertEqual(client.detect_language("Hello world"), "en")

    def test_detects_pt(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.return_value.choices[0].message.content = "pt"
        self.assertEqual(client.detect_language("Olá mundo"), "pt")

    def test_unknown_language_defaults_to_es(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.return_value.choices[0].message.content = "fr"
        self.assertEqual(client.detect_language("Bonjour"), "es")

    def test_exception_defaults_to_es(self):
        mock_ai = MagicMock()
        client = _make_client(mock_ai)
        mock_ai.chat.completions.create.side_effect = Exception("error")
        self.assertEqual(client.detect_language("Hello"), "es")
