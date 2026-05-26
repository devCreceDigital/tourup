import json
from unittest.mock import MagicMock
from django.test import TestCase
from apps.asistente_ia.ai.memory.session_memory import ConversationManager


TOKEN = "a" * 64


def _make_manager():
    """ConversationManager con redis_client mockeado, sin conexión real a Redis."""
    manager = ConversationManager.__new__(ConversationManager)
    manager.redis_client = MagicMock()
    manager.ttl_seconds = 86400
    return manager


class GetKeyTest(TestCase):
    def test_key_format(self):
        manager = _make_manager()
        key = manager._get_key("tok123", "messages")
        self.assertEqual(key, "asistente_ia:session:tok123:messages")

    def test_key_includes_suffix_intent(self):
        manager = _make_manager()
        self.assertIn("intent", manager._get_key("tok", "intent"))

    def test_key_includes_suffix_lang(self):
        manager = _make_manager()
        self.assertIn("lang", manager._get_key("tok", "lang"))


class AddMessageTest(TestCase):
    def test_rpush_called_with_serialized_json(self):
        manager = _make_manager()
        manager.add_message(TOKEN, "user", "Hola")

        manager.redis_client.rpush.assert_called_once()
        key, payload = manager.redis_client.rpush.call_args[0]
        msg = json.loads(payload)
        self.assertEqual(msg["role"], "user")
        self.assertEqual(msg["content"], "Hola")

    def test_expire_called_after_rpush(self):
        manager = _make_manager()
        manager.add_message(TOKEN, "assistant", "Respuesta")
        manager.redis_client.expire.assert_called_once()

    def test_key_contains_messages_suffix(self):
        manager = _make_manager()
        manager.add_message(TOKEN, "user", "Test")
        key_used = manager.redis_client.rpush.call_args[0][0]
        self.assertIn("messages", key_used)

    def test_message_has_ts_field(self):
        manager = _make_manager()
        manager.add_message(TOKEN, "user", "Hi")
        _, payload = manager.redis_client.rpush.call_args[0]
        msg = json.loads(payload)
        self.assertIn("ts", msg)


class GetMessagesTest(TestCase):
    def test_returns_parsed_list(self):
        manager = _make_manager()
        manager.redis_client.lrange.return_value = [
            json.dumps({"role": "user", "content": "Hi", "ts": "2024-01-01T00:00:00"}),
            json.dumps({"role": "assistant", "content": "Hello!", "ts": "2024-01-01T00:00:01"}),
        ]
        messages = manager.get_messages(TOKEN)
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0]["role"], "user")
        self.assertEqual(messages[1]["role"], "assistant")

    def test_returns_empty_list_when_no_messages(self):
        manager = _make_manager()
        manager.redis_client.lrange.return_value = []
        self.assertEqual(manager.get_messages(TOKEN), [])

    def test_lrange_called_with_full_range(self):
        manager = _make_manager()
        manager.redis_client.lrange.return_value = []
        manager.get_messages(TOKEN)
        _, start, end = manager.redis_client.lrange.call_args[0]
        self.assertEqual(start, 0)
        self.assertEqual(end, -1)


class SaveIntentTest(TestCase):
    def test_setex_called_with_serialized_data(self):
        manager = _make_manager()
        intent = {"destination": "Peru", "confidence_score": 0.9}
        manager.save_intent(TOKEN, intent)

        manager.redis_client.setex.assert_called_once()
        key, ttl, payload = manager.redis_client.setex.call_args[0]
        stored = json.loads(payload)
        self.assertEqual(stored["destination"], "Peru")

    def test_ttl_matches_24h(self):
        manager = _make_manager()
        manager.save_intent(TOKEN, {})
        _, ttl, _ = manager.redis_client.setex.call_args[0]
        self.assertEqual(ttl, 86400)


class GetIntentTest(TestCase):
    def test_returns_parsed_dict(self):
        manager = _make_manager()
        manager.redis_client.get.return_value = json.dumps({"destination": "Bali"})
        result = manager.get_intent(TOKEN)
        self.assertEqual(result["destination"], "Bali")

    def test_returns_empty_dict_when_none(self):
        manager = _make_manager()
        manager.redis_client.get.return_value = None
        result = manager.get_intent(TOKEN)
        self.assertEqual(result, {})


class SetLanguageTest(TestCase):
    def test_setex_stores_language_value(self):
        manager = _make_manager()
        manager.set_language(TOKEN, "en")
        _, _, value = manager.redis_client.setex.call_args[0]
        self.assertEqual(value, "en")

    def test_key_contains_lang_suffix(self):
        manager = _make_manager()
        manager.set_language(TOKEN, "pt")
        key, _, _ = manager.redis_client.setex.call_args[0]
        self.assertIn("lang", key)


class GetLanguageTest(TestCase):
    def test_returns_stored_language(self):
        manager = _make_manager()
        manager.redis_client.get.return_value = "en"
        self.assertEqual(manager.get_language(TOKEN), "en")

    def test_defaults_to_es_when_redis_returns_none(self):
        manager = _make_manager()
        manager.redis_client.get.return_value = None
        self.assertEqual(manager.get_language(TOKEN), "es")


class IsSessionActiveTest(TestCase):
    def test_active_when_key_exists(self):
        manager = _make_manager()
        manager.redis_client.exists.return_value = 1
        self.assertTrue(manager.is_session_active(TOKEN))

    def test_inactive_when_key_missing(self):
        manager = _make_manager()
        manager.redis_client.exists.return_value = 0
        self.assertFalse(manager.is_session_active(TOKEN))


class ExpireSessionTest(TestCase):
    def test_deletes_exactly_three_keys(self):
        manager = _make_manager()
        manager.expire_session(TOKEN)
        self.assertEqual(manager.redis_client.delete.call_count, 3)

    def test_deletes_messages_intent_lang_keys(self):
        manager = _make_manager()
        manager.expire_session(TOKEN)
        deleted_keys = [call[0][0] for call in manager.redis_client.delete.call_args_list]
        suffixes = [k.split(":")[-1] for k in deleted_keys]
        self.assertIn("messages", suffixes)
        self.assertIn("intent", suffixes)
        self.assertIn("lang", suffixes)


class GetSessionInfoTest(TestCase):
    def test_returns_complete_info_structure(self):
        manager = _make_manager()
        manager.redis_client.lrange.return_value = [
            json.dumps({"role": "user", "content": "Hi", "ts": "2024-01-01T00:00:00"})
        ]
        manager.redis_client.get.side_effect = [
            json.dumps({"destination": "Peru"}),
            "es",
        ]
        manager.redis_client.exists.return_value = 1

        info = manager.get_session_info(TOKEN)

        self.assertEqual(info["messages_count"], 1)
        self.assertTrue(info["has_intent"])
        self.assertEqual(info["language"], "es")
        self.assertTrue(info["is_active"])

    def test_returns_false_flags_when_empty_session(self):
        manager = _make_manager()
        manager.redis_client.lrange.return_value = []
        manager.redis_client.get.side_effect = [None, "es"]
        manager.redis_client.exists.return_value = 0

        info = manager.get_session_info(TOKEN)

        self.assertFalse(info["has_intent"])
        self.assertFalse(info["is_active"])
        self.assertEqual(info["messages_count"], 0)
