from unittest.mock import MagicMock, call, patch

from django.test import TestCase, override_settings

from apps.tenancy.db_context import apply_db_context, reset_db_context


@override_settings(DB_RLS_CONTEXT_ENABLED=True)
class DbContextTest(TestCase):
    @patch("apps.tenancy.db_context.connection")
    def test_apply_db_context_sets_runtime_keys(self, mock_connection):
        mock_connection.vendor = "postgresql"
        cursor_cm = MagicMock()
        mock_connection.cursor.return_value.__enter__.return_value = cursor_cm

        apply_db_context(tenant_id="tenant-1", user_id="user-1", role="admin")

        self.assertEqual(cursor_cm.execute.call_count, 3)
        cursor_cm.execute.assert_has_calls(
            [
                call("SELECT set_config(%s, %s, false)", ["app.current_tenant", "tenant-1"]),
                call("SELECT set_config(%s, %s, false)", ["app.current_user_id", "user-1"]),
                call("SELECT set_config(%s, %s, false)", ["app.current_role", "admin"]),
            ]
        )

    @patch("apps.tenancy.db_context.connection")
    def test_reset_db_context_clears_runtime_keys(self, mock_connection):
        mock_connection.vendor = "postgresql"
        cursor_cm = MagicMock()
        mock_connection.cursor.return_value.__enter__.return_value = cursor_cm

        reset_db_context()

        self.assertEqual(cursor_cm.execute.call_count, 3)
        cursor_cm.execute.assert_has_calls(
            [
                call("SELECT set_config(%s, %s, false)", ["app.current_tenant", ""]),
                call("SELECT set_config(%s, %s, false)", ["app.current_user_id", ""]),
                call("SELECT set_config(%s, %s, false)", ["app.current_role", ""]),
            ]
        )

    @patch("apps.tenancy.db_context.connection")
    def test_apply_db_context_is_noop_for_sqlite(self, mock_connection):
        mock_connection.vendor = "sqlite"

        apply_db_context(tenant_id="tenant-1", user_id="user-1", role="admin")

        mock_connection.cursor.assert_not_called()
