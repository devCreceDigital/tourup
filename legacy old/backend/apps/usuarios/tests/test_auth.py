import json
import uuid
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework import exceptions
from rest_framework.test import APIRequestFactory

from apps.usuarios.authentication import SupabaseAuthentication
from apps.usuarios.tokens import build_token_pair
from apps.usuarios.views import LoginView, RefreshTokenView


@override_settings(
    APP_JWT_SECRET="test-app-secret-at-least-32-bytes",
    APP_JWT_ISSUER="totem-backend",
    APP_JWT_ACCESS_MINUTES=15,
    APP_JWT_REFRESH_DAYS=7,
)
class AppJwtAuthenticationTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.auth = SupabaseAuthentication()
        self.tenant_id = uuid.uuid4()
        self.tokens = build_token_pair(
            user_id=str(uuid.uuid4()),
            email="admin@totem.test",
            tenant_id=str(self.tenant_id),
            role="admin",
        )

    def test_authenticate_accepts_app_access_token(self):
        request = self.factory.get(
            "/api/viajes/",
            HTTP_AUTHORIZATION=f"Bearer {self.tokens['access_token']}",
        )
        request.tenant_id = self.tenant_id

        with patch("apps.usuarios.authentication.apply_db_context") as mock_apply_db_context:
            user, _token = self.auth.authenticate(request)

        self.assertEqual(user.email, "admin@totem.test")
        self.assertEqual(user.rol, "admin")
        self.assertEqual(str(user.tenant_id), str(self.tenant_id))
        mock_apply_db_context.assert_called_once()

    def test_authenticate_rejects_tenant_mismatch(self):
        request = self.factory.get(
            "/api/viajes/",
            HTTP_AUTHORIZATION=f"Bearer {self.tokens['access_token']}",
        )
        request.tenant_id = uuid.uuid4()

        with self.assertRaises(exceptions.AuthenticationFailed):
            self.auth.authenticate(request)


@override_settings(
    APP_JWT_SECRET="test-app-secret-at-least-32-bytes",
    APP_JWT_ISSUER="totem-backend",
    APP_JWT_ACCESS_MINUTES=15,
    APP_JWT_REFRESH_DAYS=7,
)
class AuthEndpointsTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.login_view = LoginView.as_view()
        self.refresh_view = RefreshTokenView.as_view()
        self.perfil = SimpleNamespace(
            id=uuid.uuid4(),
            email="admin@agencia.test",
            nombre="Admin Agencia",
            tenant_id=uuid.uuid4(),
            rol="admin",
        )

    def test_login_returns_token_pair_with_tenant_and_role(self):
        request = self.factory.post(
            "/api/auth/login/",
            data=json.dumps({"email": "admin@agencia.test", "password": "secret123"}),
            content_type="application/json",
        )
        request.tenant_id = self.perfil.tenant_id

        with (
            patch("apps.usuarios.views.authenticate_with_supabase", return_value={"user": {"id": str(self.perfil.id)}}),
            patch("apps.usuarios.views.get_profile_for_login", return_value=self.perfil),
        ):
            response = self.login_view(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["email"], self.perfil.email)
        self.assertEqual(response.data["user"]["role"], "admin")
        self.assertEqual(response.data["user"]["tenant_id"], str(self.perfil.tenant_id))
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)

    def test_login_rejects_tenant_mismatch(self):
        request = self.factory.post(
            "/api/auth/login/",
            data=json.dumps({"email": "admin@agencia.test", "password": "secret123"}),
            content_type="application/json",
        )
        request.tenant_id = uuid.uuid4()

        with (
            patch("apps.usuarios.views.authenticate_with_supabase", return_value={"user": {"id": str(self.perfil.id)}}),
            patch("apps.usuarios.views.get_profile_for_login", return_value=self.perfil),
        ):
            response = self.login_view(request)

        self.assertEqual(response.status_code, 401)

    def test_refresh_returns_new_token_pair(self):
        initial_tokens = build_token_pair(
            user_id=str(self.perfil.id),
            email=self.perfil.email,
            tenant_id=str(self.perfil.tenant_id),
            role="admin",
        )
        request = self.factory.post(
            "/api/auth/refresh/",
            data=json.dumps({"refresh_token": initial_tokens["refresh_token"]}),
            content_type="application/json",
        )

        response = self.refresh_view(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["email"], self.perfil.email)
        self.assertEqual(response.data["user"]["role"], "admin")
        self.assertEqual(response.data["user"]["tenant_id"], str(self.perfil.tenant_id))
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
