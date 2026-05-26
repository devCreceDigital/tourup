from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework import serializers

from apps.planes.serializers import PlanSerializer


class PlanSerializerTest(TestCase):
    def test_validate_features_accepts_trimmed_string_list(self):
        serializer = PlanSerializer()
        value = serializer.validate_features([" Dashboard ", "Reportes"])
        self.assertEqual(value, ["Dashboard", "Reportes"])

    def test_validate_features_rejects_non_list(self):
        serializer = PlanSerializer()
        with self.assertRaises(serializers.ValidationError):
            serializer.validate_features({"feature": "Dashboard"})

    def test_validate_rejects_negative_limits(self):
        serializer = PlanSerializer()
        with self.assertRaises(serializers.ValidationError):
            serializer.validate({"max_trips": -1})

    def test_create_sets_created_at_and_saves_model(self):
        serializer = PlanSerializer()
        payload = {
            "name": "Growth",
            "description": "Plan para agencias medianas",
            "price_monthly": Decimal("99.00"),
            "price_yearly": Decimal("999.00"),
            "max_trips": 25,
            "max_inscriptions": 500,
            "features": ["Soporte prioritario"],
            "is_active": True,
        }
        created = MagicMock()
        created.created_at = None
        with patch("apps.planes.serializers.Plan", return_value=created) as mock_plan:
            result = serializer.create(payload)
        self.assertEqual(result, created)
        mock_plan.assert_called_once_with(**payload)
        self.assertIsNotNone(created.created_at)
        created.save.assert_called_once()
