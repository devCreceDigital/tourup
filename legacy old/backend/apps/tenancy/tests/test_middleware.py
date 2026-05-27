import uuid
from types import SimpleNamespace
from unittest.mock import patch

from django.http import JsonResponse
from django.test import RequestFactory, TestCase, override_settings

from apps.tenancy.middleware import TenantResolutionMiddleware, get_tenant_request_candidates
from apps.usuarios.tokens import build_token_pair


def _ok_response(request):
    payload = {
        "tenant_id": str(getattr(request, "tenant_id", "") or ""),
        "tenant_source": getattr(request, "tenant_source", None),
    }
    return JsonResponse(payload, status=200)


@override_settings(
    TENANCY_ROOT_HOSTS=["localhost", "127.0.0.1", "backend"],
    TENANCY_EXEMPT_PATH_PREFIXES=["/health/", "/admin/", "/api/tenants/", "/api/debug-auth/"],
    TENANCY_HEADER_NAME="X-Tenant-ID",
    APP_JWT_SECRET="test-app-secret-at-least-32-bytes",
    APP_JWT_ISSUER="totem-backend",
    APP_JWT_ACCESS_MINUTES=15,
    APP_JWT_REFRESH_DAYS=7,
)
class TenantResolutionMiddlewareTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = TenantResolutionMiddleware(_ok_response)
        self.active_tenant = SimpleNamespace(
            id=uuid.uuid4(),
            domain="norte.example.com",
            status="active",
        )
        self.suspended_tenant = SimpleNamespace(
            id=uuid.uuid4(),
            domain="sur.example.com",
            status="suspended",
        )
        self.other_active_tenant = SimpleNamespace(
            id=uuid.uuid4(),
            domain="otro.example.com",
            status="active",
        )

    def test_exempt_path_skips_resolution(self):
        request = self.factory.get("/health/", HTTP_HOST="unknown.example.com")
        with patch("apps.tenancy.middleware.reset_db_context") as mock_reset:
            response = self.middleware(request)

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"tenant_id": "", "tenant_source": None})
        self.assertEqual(mock_reset.call_count, 2)

    def test_header_resolves_tenant_and_sets_request_context(self):
        request = self.factory.get(
            "/api/viajes/",
            HTTP_HOST="localhost:8000",
            HTTP_X_TENANT_ID=str(self.active_tenant.id),
        )
        with (
            patch("apps.tenancy.middleware.get_tenant_for_header", return_value=self.active_tenant),
            patch("apps.tenancy.middleware.apply_db_context") as mock_apply_db_context,
        ):
            response = self.middleware(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(request.tenant, self.active_tenant)
        self.assertEqual(str(request.tenant_id), str(self.active_tenant.id))
        self.assertEqual(request.tenant_source, "header")
        mock_apply_db_context.assert_called_once_with(tenant_id=self.active_tenant.id)

    def test_host_resolves_tenant_when_not_root_host(self):
        request = self.factory.get("/api/public/viajes/", HTTP_HOST="norte.example.com")
        with patch("apps.tenancy.middleware.get_tenant_for_host", return_value=self.active_tenant):
            response = self.middleware(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(str(request.tenant_id), str(self.active_tenant.id))
        self.assertEqual(request.tenant_source, "host")

    def test_jwt_resolves_tenant_when_header_and_host_are_missing(self):
        tokens = build_token_pair(
            user_id=str(uuid.uuid4()),
            email="admin@totem.test",
            tenant_id=str(self.active_tenant.id),
            role="admin",
        )
        request = self.factory.get(
            "/api/viajes/",
            HTTP_HOST="localhost:8000",
            HTTP_AUTHORIZATION=f"Bearer {tokens['access_token']}",
        )
        with patch("apps.tenancy.middleware.get_tenant_for_header", return_value=self.active_tenant):
            response = self.middleware(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(str(request.tenant_id), str(self.active_tenant.id))
        self.assertEqual(request.tenant_source, "jwt")

    def test_unknown_header_tenant_returns_401(self):
        request = self.factory.get(
            "/api/viajes/",
            HTTP_HOST="localhost:8000",
            HTTP_X_TENANT_ID=str(uuid.uuid4()),
        )
        with patch("apps.tenancy.middleware.get_tenant_for_header", return_value=None):
            response = self.middleware(request)

        self.assertEqual(response.status_code, 401)
        self.assertJSONEqual(response.content, {"detail": "Tenant no encontrado para X-Tenant-ID."})

    def test_unknown_host_tenant_returns_401(self):
        request = self.factory.get("/api/public/viajes/", HTTP_HOST="desconocido.example.com")
        with patch("apps.tenancy.middleware.get_tenant_for_host", return_value=None):
            response = self.middleware(request)

        self.assertEqual(response.status_code, 401)
        self.assertJSONEqual(response.content, {"detail": "Tenant no encontrado para el host solicitado."})

    def test_inactive_tenant_returns_403(self):
        request = self.factory.get("/api/public/viajes/", HTTP_HOST="sur.example.com")
        with patch("apps.tenancy.middleware.get_tenant_for_host", return_value=self.suspended_tenant):
            response = self.middleware(request)

        self.assertEqual(response.status_code, 403)
        self.assertJSONEqual(response.content, {"detail": "El tenant no esta activo."})

    def test_conflicting_host_and_header_returns_401(self):
        request = self.factory.get(
            "/api/viajes/",
            HTTP_HOST="otro.example.com",
            HTTP_X_TENANT_ID=str(self.active_tenant.id),
        )
        with (
            patch("apps.tenancy.middleware.get_tenant_for_header", return_value=self.active_tenant),
            patch("apps.tenancy.middleware.get_tenant_for_host", return_value=self.other_active_tenant),
        ):
            response = self.middleware(request)

        self.assertEqual(response.status_code, 401)
        self.assertJSONEqual(response.content, {"detail": "Conflicto de tenant entre host, X-Tenant-ID o JWT."})


@override_settings(
    TENANCY_ROOT_HOSTS=["localhost", "127.0.0.1", "backend"],
    TENANCY_HEADER_NAME="X-Tenant-ID",
    APP_JWT_SECRET="test-app-secret-at-least-32-bytes",
    APP_JWT_ISSUER="totem-backend",
    APP_JWT_ACCESS_MINUTES=15,
    APP_JWT_REFRESH_DAYS=7,
)
class TenantRequestCandidatesTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_collects_header_and_host_candidates(self):
        tenant_id = uuid.uuid4()
        request = self.factory.get(
            "/api/viajes/",
            HTTP_HOST="norte.example.com",
            HTTP_X_TENANT_ID=str(tenant_id),
        )

        candidates = get_tenant_request_candidates(request)

        self.assertEqual(candidates, [("header", str(tenant_id)), ("host", "norte.example.com")])

    def test_ignores_root_hosts(self):
        request = self.factory.get("/api/viajes/", HTTP_HOST="localhost:8000")

        candidates = get_tenant_request_candidates(request)

        self.assertEqual(candidates, [])

    def test_collects_jwt_candidate_when_no_header_or_host(self):
        tenant_id = uuid.uuid4()
        tokens = build_token_pair(
            user_id=str(uuid.uuid4()),
            email="admin@totem.test",
            tenant_id=str(tenant_id),
            role="admin",
        )
        request = self.factory.get(
            "/api/viajes/",
            HTTP_HOST="localhost:8000",
            HTTP_AUTHORIZATION=f"Bearer {tokens['access_token']}",
        )

        candidates = get_tenant_request_candidates(request)

        self.assertEqual(candidates, [("jwt", str(tenant_id))])
