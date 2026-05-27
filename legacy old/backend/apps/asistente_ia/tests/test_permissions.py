import hashlib
from unittest.mock import MagicMock
from django.test import TestCase, RequestFactory
from apps.asistente_ia.permissions import (
    AsistenteIARateThrottle,
    SessionRateThrottle,
    MessageRateThrottle,
    LeadRateThrottle,
)


class AsistenteIARateThrottleTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        # Bypass __init__ to avoid settings lookup for 'asistente_ia' throttle rate
        self.throttle = AsistenteIARateThrottle.__new__(AsistenteIARateThrottle)
        self.throttle.rate = "10/hour"

    def test_cache_key_contains_hashed_ip(self):
        request = self.factory.get("/", REMOTE_ADDR="192.168.1.1")
        view = MagicMock()
        view.throttle_scope = "test_scope"

        key = self.throttle.get_cache_key(request, view)

        ip_hash = hashlib.sha256("192.168.1.1".encode()).hexdigest()[:16]
        self.assertIn(ip_hash, key)

    def test_cache_key_has_prefix(self):
        request = self.factory.get("/", REMOTE_ADDR="10.0.0.1")
        view = MagicMock()
        view.throttle_scope = "sessions"

        key = self.throttle.get_cache_key(request, view)

        self.assertTrue(key.startswith("asistente_ia:ratelimit:"))

    def test_cache_key_uses_view_scope(self):
        request = self.factory.get("/", REMOTE_ADDR="10.0.0.1")
        view = MagicMock()
        view.throttle_scope = "leads"

        key = self.throttle.get_cache_key(request, view)

        self.assertIn("leads", key)

    def test_cache_key_falls_back_to_default_scope(self):
        request = self.factory.get("/", REMOTE_ADDR="10.0.0.1")
        view = MagicMock(spec=[])  # no throttle_scope attribute

        key = self.throttle.get_cache_key(request, view)

        self.assertIn("asistente_ia", key)

    def test_different_ips_produce_different_keys(self):
        view = MagicMock()
        view.throttle_scope = "messages"
        req1 = self.factory.get("/", REMOTE_ADDR="1.1.1.1")
        req2 = self.factory.get("/", REMOTE_ADDR="2.2.2.2")

        key1 = self.throttle.get_cache_key(req1, view)
        key2 = self.throttle.get_cache_key(req2, view)

        self.assertNotEqual(key1, key2)


class SessionRateThrottleTest(TestCase):
    def test_scope(self):
        self.assertEqual(SessionRateThrottle.scope, "sessions")

    def test_rate(self):
        self.assertEqual(SessionRateThrottle.rate, "5/hour")


class MessageRateThrottleTest(TestCase):
    def test_scope(self):
        self.assertEqual(MessageRateThrottle.scope, "messages")

    def test_rate(self):
        self.assertEqual(MessageRateThrottle.rate, "10/hour")


class LeadRateThrottleTest(TestCase):
    def test_scope(self):
        self.assertEqual(LeadRateThrottle.scope, "leads")

    def test_rate(self):
        self.assertEqual(LeadRateThrottle.rate, "3/hour")
