from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework import serializers

from apps.tenancy.models import Tenant
from apps.tenancy.serializers import TenantSerializer


class TenantSerializerTest(TestCase):
    def test_validate_domain_normalizes_lowercase_and_whitespace(self):
        serializer = TenantSerializer()
        with patch("apps.tenancy.serializers.Tenant.objects.filter") as mock_filter:
            mock_filter.return_value.exists.return_value = False
            value = serializer.validate_domain("  AGENCIA.Example.COM  ")
        self.assertEqual(value, "agencia.example.com")

    def test_validate_domain_rejects_protocol(self):
        serializer = TenantSerializer()
        with self.assertRaises(serializers.ValidationError):
            serializer.validate_domain("https://agencia.example.com")

    def test_validate_domain_rejects_slash_path(self):
        serializer = TenantSerializer()
        with self.assertRaises(serializers.ValidationError):
            serializer.validate_domain("agencia.example.com/path")

    def test_validate_domain_rejects_duplicate_domain(self):
        serializer = TenantSerializer()
        with patch("apps.tenancy.serializers.Tenant.objects.filter") as mock_filter:
            mock_filter.return_value.exists.return_value = True
            with self.assertRaises(serializers.ValidationError):
                serializer.validate_domain("agencia.example.com")

    def test_validate_plan_id_rejects_unknown_plan(self):
        serializer = TenantSerializer()
        with patch("apps.tenancy.serializers.Plan.objects.filter") as mock_filter:
            mock_filter.return_value.exists.return_value = False
            with self.assertRaises(serializers.ValidationError):
                serializer.validate_plan_id("f22a6556-a8c5-47cb-b4d2-aa350fcb8c10")

    def test_create_sets_created_at_and_saves_model(self):
        serializer = TenantSerializer()
        payload = {
            "name": "Agencia Norte",
            "domain": "norte.example.com",
            "plan_id": "f22a6556-a8c5-47cb-b4d2-aa350fcb8c10",
            "status": Tenant.STATUS_ACTIVE,
        }
        created = MagicMock()
        created.created_at = None
        with patch("apps.tenancy.serializers.Tenant", return_value=created) as mock_tenant:
            result = serializer.create(payload)
        self.assertEqual(result, created)
        mock_tenant.assert_called_once_with(**payload)
        self.assertIsNotNone(created.created_at)
        created.save.assert_called_once()
