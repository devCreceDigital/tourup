from types import SimpleNamespace

from django.test import RequestFactory, TestCase

from apps.documentos.views import DocumentosRolePermission
from apps.usuarios.rbac import (
    ROLE_ADMIN,
    ROLE_STAFF,
    ROLE_SUPERADMIN,
    ROLE_USER,
    get_request_raw_role,
    get_request_role,
    has_any_role,
    normalize_role,
)
from apps.viajes.views import OperacionesRolePermission


class RbacHelpersTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_normalize_role_supports_legacy_values(self):
        self.assertEqual(normalize_role("profesor"), ROLE_STAFF)
        self.assertEqual(normalize_role("alumno"), ROLE_USER)
        self.assertEqual(normalize_role("usuario"), ROLE_USER)

    def test_get_request_role_preserves_superadmin_and_maps_legacy(self):
        request = self.factory.get("/api/test/")
        request.user = SimpleNamespace(is_authenticated=True, rol="superadmin")
        self.assertEqual(get_request_raw_role(request), ROLE_SUPERADMIN)
        self.assertEqual(get_request_role(request), ROLE_SUPERADMIN)

        request.user = SimpleNamespace(is_authenticated=True, rol="profesor")
        self.assertEqual(get_request_raw_role(request), "profesor")
        self.assertEqual(get_request_role(request), ROLE_STAFF)

    def test_has_any_role_accepts_canonical_and_legacy_inputs(self):
        request = self.factory.get("/api/test/")
        request.user = SimpleNamespace(is_authenticated=True, rol="alumno")

        self.assertTrue(has_any_role(request, ROLE_USER))
        self.assertTrue(has_any_role(request, "usuario"))
        self.assertFalse(has_any_role(request, ROLE_ADMIN))


class RbacPermissionsTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_operaciones_permission_allows_staff_read_and_denies_write(self):
        request = self.factory.get("/api/operaciones/")
        request.user = SimpleNamespace(is_authenticated=True, rol="staff")
        self.assertTrue(OperacionesRolePermission().has_permission(request, None))

        post_request = self.factory.post("/api/operaciones/")
        post_request.user = SimpleNamespace(is_authenticated=True, rol="staff")
        self.assertFalse(OperacionesRolePermission().has_permission(post_request, None))

    def test_documentos_permission_allows_user_post(self):
        request = self.factory.post("/api/documentos/")
        request.user = SimpleNamespace(is_authenticated=True, rol="user")
        self.assertTrue(DocumentosRolePermission().has_permission(request, None))
