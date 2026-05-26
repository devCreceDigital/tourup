import json
import uuid
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.tenancy.views import TenantAdminPermission, TenantViewSet


class TenantPermissionTest(TestCase):
    def test_superadmin_can_manage_tenants(self):
        request = SimpleNamespace(user=SimpleNamespace(is_authenticated=True, rol="superadmin"))
        self.assertTrue(TenantAdminPermission().has_permission(request, None))

    def test_regular_user_cannot_manage_tenants(self):
        request = SimpleNamespace(user=SimpleNamespace(is_authenticated=True, rol="usuario"))
        self.assertFalse(TenantAdminPermission().has_permission(request, None))


class TenantViewSetTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.create_view = TenantViewSet.as_view({"post": "create"})
        self.admin_user = SimpleNamespace(is_authenticated=True, rol="superadmin", email="root@totem.test")
        self.regular_user = SimpleNamespace(is_authenticated=True, rol="usuario", email="user@totem.test")

    def test_post_tenants_returns_201_and_normalized_domain(self):
        plan_id = uuid.uuid4()
        tenant = SimpleNamespace(
            id=uuid.uuid4(),
            name="Agencia Norte",
            domain="norte.example.com",
            plan_id=plan_id,
            status="active",
            created_at=timezone.now(),
        )
        request = self.factory.post(
            "/api/tenants/",
            data=json.dumps(
                {
                    "name": "Agencia Norte",
                    "domain": "NORTE.EXAMPLE.COM",
                    "plan_id": str(plan_id),
                    "status": "active",
                }
            ),
            content_type="application/json",
        )
        force_authenticate(request, user=self.admin_user)

        with (
            patch("apps.tenancy.serializers.Tenant.objects.filter") as mock_filter,
            patch("apps.tenancy.serializers.Plan.objects.filter") as mock_plan_filter,
            patch("apps.tenancy.serializers.TenantSerializer.create", return_value=tenant),
        ):
            mock_filter.return_value.exists.return_value = False
            mock_plan_filter.return_value.exists.return_value = True
            response = self.create_view(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["domain"], "norte.example.com")
        self.assertEqual(response.data["name"], "Agencia Norte")
        self.assertEqual(response.data["plan_id"], str(plan_id))

    def test_post_tenants_rejects_non_admin(self):
        request = self.factory.post(
            "/api/tenants/",
            data=json.dumps(
                {
                    "name": "Agencia Norte",
                    "domain": "norte.example.com",
                    "plan_id": str(uuid.uuid4()),
                    "status": "active",
                }
            ),
            content_type="application/json",
        )
        force_authenticate(request, user=self.regular_user)

        response = self.create_view(request)

        self.assertEqual(response.status_code, 403)

    def test_post_tenants_rejects_duplicate_domain(self):
        request = self.factory.post(
            "/api/tenants/",
            data=json.dumps(
                {
                    "name": "Agencia Norte",
                    "domain": "norte.example.com",
                    "plan_id": str(uuid.uuid4()),
                    "status": "active",
                }
            ),
            content_type="application/json",
        )
        force_authenticate(request, user=self.admin_user)

        with (
            patch("apps.tenancy.serializers.Tenant.objects.filter") as mock_filter,
            patch("apps.tenancy.serializers.Plan.objects.filter") as mock_plan_filter,
        ):
            mock_filter.return_value.exists.return_value = True
            mock_plan_filter.return_value.exists.return_value = True
            response = self.create_view(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn("domain", response.data)
