import json
import uuid
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.planes.views import PlanAdminPermission, PlanViewSet


class PlanPermissionTest(TestCase):
    def test_superadmin_can_manage_plans(self):
        request = SimpleNamespace(user=SimpleNamespace(is_authenticated=True, rol="superadmin"))
        self.assertTrue(PlanAdminPermission().has_permission(request, None))

    def test_regular_user_cannot_manage_plans(self):
        request = SimpleNamespace(user=SimpleNamespace(is_authenticated=True, rol="usuario"))
        self.assertFalse(PlanAdminPermission().has_permission(request, None))


class PlanViewSetTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.create_view = PlanViewSet.as_view({"post": "create"})
        self.admin_user = SimpleNamespace(is_authenticated=True, rol="superadmin", email="root@totem.test")
        self.regular_user = SimpleNamespace(is_authenticated=True, rol="usuario", email="user@totem.test")

    def test_post_plans_returns_201(self):
        plan = SimpleNamespace(
            id=uuid.uuid4(),
            name="Growth",
            description="Plan para agencias medianas",
            price_monthly="99.00",
            price_yearly="999.00",
            max_trips=25,
            max_inscriptions=500,
            features=["Dashboard", "Soporte prioritario"],
            is_active=True,
            created_at=timezone.now(),
        )
        request = self.factory.post(
            "/api/plans/",
            data=json.dumps(
                {
                    "name": "Growth",
                    "description": "Plan para agencias medianas",
                    "price_monthly": "99.00",
                    "price_yearly": "999.00",
                    "max_trips": 25,
                    "max_inscriptions": 500,
                    "features": ["Dashboard", "Soporte prioritario"],
                    "is_active": True,
                }
            ),
            content_type="application/json",
        )
        force_authenticate(request, user=self.admin_user)

        with patch("apps.planes.serializers.PlanSerializer.create", return_value=plan):
            response = self.create_view(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "Growth")
        self.assertEqual(response.data["max_trips"], 25)
        self.assertEqual(response.data["max_inscriptions"], 500)

    def test_post_plans_rejects_non_admin(self):
        request = self.factory.post(
            "/api/plans/",
            data=json.dumps(
                {
                    "name": "Starter",
                    "features": ["Panel base"],
                    "is_active": True,
                }
            ),
            content_type="application/json",
        )
        force_authenticate(request, user=self.regular_user)

        response = self.create_view(request)

        self.assertEqual(response.status_code, 403)
