#!/usr/bin/env python
"""
Smoke test del IntentEngine sin levantar Django (ejecutable como script).
"""

import json
import os
import sys
from unittest.mock import MagicMock, patch


def _bootstrap_min_django_settings():
    class MockSettings:
        REDIS_HOST = "localhost"
        REDIS_PORT = 6379
        REDIS_DB = 0

    sys.modules["django.conf"] = MagicMock()
    sys.modules["django.conf"].settings = MockSettings()


def test_intent_result_dataclass():
    from apps.asistente_ia.ai.parsers.response_parser import IntentResult

    result = IntentResult(
        destination="Perú",
        confidence_score=0.8,
        fields_detected=5,
        needs_clarification=False,
    )

    assert result.destination == "Perú"
    assert result.confidence_score == 0.8
    assert result.fields_detected == 5
    assert result.needs_clarification is False
    assert result.duration is None
    assert result.interests is None


def test_extract_intent_mock():
    from apps.asistente_ia.ai.parsers.response_parser import IntentEngine

    engine = IntentEngine()

    with patch("apps.asistente_ia.ai.parsers.response_parser.openrouter_client") as mock_client:
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps(
            {
                "destination": "Perú",
                "duration": "10 días",
                "group_type": "familiar",
                "group_size": 4,
                "budget_range": "mid-range",
                "interests": ["cultura", "naturaleza"],
                "departure_month": "julio",
                "confidence_score": 0.9,
                "fields_detected": 7,
                "needs_clarification": False,
                "clarification_question": None,
            }
        )
        mock_client.extract_intent.return_value = mock_response.choices[0].message.content

        messages = [
            {"role": "user", "content": "Perú 10 días familia 4 julio mid-range cultura naturaleza"}
        ]
        result = engine.extract_intent(messages, "es")

        assert result.destination == "Perú"
        assert result.duration == "10 días"
        assert result.group_type == "familiar"
        assert result.group_size == 4
        assert result.budget_range == "mid-range"
        assert result.interests == ["cultura", "naturaleza"]
        assert result.departure_month == "julio"
        assert result.confidence_score == 0.9
        assert result.fields_detected == 7
        assert result.needs_clarification is False


def test_extract_intent_vague():
    from apps.asistente_ia.ai.parsers.response_parser import IntentEngine

    engine = IntentEngine()

    with patch("apps.asistente_ia.ai.parsers.response_parser.openrouter_client") as mock_client:
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps(
            {
                "destination": None,
                "duration": None,
                "group_type": None,
                "group_size": None,
                "budget_range": None,
                "interests": [],
                "departure_month": None,
                "confidence_score": 0.2,
                "fields_detected": 0,
                "needs_clarification": True,
                "clarification_question": "¿Podrías contarme más sobre el viaje que estás buscando?",
            }
        )
        mock_client.extract_intent.return_value = mock_response.choices[0].message.content

        messages = [{"role": "user", "content": "Quiero un viaje bonito"}]
        result = engine.extract_intent(messages, "es")

        assert result.confidence_score < 0.30
        assert result.needs_clarification is True
        assert result.fields_detected == 0
        assert "¿Podrías contarme" in (result.clarification_question or "")


def main() -> int:
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    _bootstrap_min_django_settings()

    test_intent_result_dataclass()
    test_extract_intent_mock()
    test_extract_intent_vague()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

