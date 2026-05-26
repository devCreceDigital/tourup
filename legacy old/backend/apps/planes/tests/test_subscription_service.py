"""
Tests unitarios del SubscriptionService.
Cubren B-04 (cambio de plan), B-05 (renovación), B-06 (cancelación/reactivación).
"""
import uuid
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.utils import timezone

from apps.planes.models import (
    PaymentAttempt,
    Plan,
    Subscription,
    SubscriptionHistory,
)
from apps.planes.services import (
    AlreadyCancelledError,
    NotCancelledError,
    PlanNotFoundError,
    SamePlanError,
    SubscriptionNotActiveError,
    SubscriptionService,
)


def _make_plan(name="Básico", price_monthly=None, max_trips=5) -> Plan:
    """Crea un Plan con managed=False usando save() forzado."""
    from django.db import connection
    p_id = uuid.uuid4()
    with connection.cursor() as c:
        c.execute(
            """
            INSERT INTO plans (id, name, description, price_monthly, price_yearly,
                               max_trips, max_inscriptions, features, is_active, created_at)
            VALUES (%s,%s,'',%s,NULL,%s,NULL,'[]',TRUE,NOW())
            ON CONFLICT (id) DO NOTHING
            """,
            [str(p_id), name, price_monthly or 50, max_trips],
        )
    return Plan.objects.get(id=p_id)


def _make_sub(plan, status=Subscription.STATUS_ACTIVE, days_remaining=30) -> Subscription:
    now = timezone.now()
    return Subscription.objects.create(
        tenant_id            = uuid.uuid4(),
        plan_id              = plan.id,
        status               = status,
        billing_cycle        = Subscription.CYCLE_MONTHLY,
        current_period_start = now,
        current_period_end   = now + timedelta(days=days_remaining),
    )


class TestChangePlan(TestCase):

    def setUp(self):
        self.basic_plan   = _make_plan("Básico",   price_monthly=Decimal("50"), max_trips=5)
        self.premium_plan = _make_plan("Premium",  price_monthly=Decimal("150"), max_trips=50)
        self.sub = _make_sub(self.basic_plan)

    def test_upgrade_inmediato(self):
        updated = SubscriptionService.change_plan(
            subscription = self.sub,
            new_plan_id  = str(self.premium_plan.id),
        )
        self.assertEqual(str(updated.plan_id), str(self.premium_plan.id))
        history = SubscriptionHistory.objects.filter(subscription_id=self.sub.id).first()
        self.assertEqual(history.change_type, SubscriptionHistory.CHANGE_UPGRADE)
        self.assertIsNotNone(history.proration_credit)
        self.assertGreaterEqual(history.proration_credit, Decimal("0"))

    def test_downgrade_inmediato(self):
        sub = _make_sub(self.premium_plan)
        updated = SubscriptionService.change_plan(
            subscription = sub,
            new_plan_id  = str(self.basic_plan.id),
        )
        self.assertEqual(str(updated.plan_id), str(self.basic_plan.id))
        history = SubscriptionHistory.objects.filter(subscription_id=sub.id).first()
        self.assertEqual(history.change_type, SubscriptionHistory.CHANGE_DOWNGRADE)

    def test_downgrade_at_period_end(self):
        sub = _make_sub(self.premium_plan)
        updated = SubscriptionService.change_plan(
            subscription            = sub,
            new_plan_id             = str(self.basic_plan.id),
            downgrade_at_period_end = True,
        )
        # Plan NO debe cambiar todavía
        self.assertEqual(str(updated.plan_id), str(self.premium_plan.id))
        history = SubscriptionHistory.objects.filter(subscription_id=sub.id).first()
        self.assertIn("PENDING_DOWNGRADE", history.notes)

    def test_plan_inexistente_lanza_error(self):
        with self.assertRaises(PlanNotFoundError):
            SubscriptionService.change_plan(
                subscription = self.sub,
                new_plan_id  = str(uuid.uuid4()),
            )

    def test_mismo_plan_lanza_error(self):
        with self.assertRaises(SamePlanError):
            SubscriptionService.change_plan(
                subscription = self.sub,
                new_plan_id  = str(self.basic_plan.id),
            )

    def test_sub_cancelada_lanza_error(self):
        sub = _make_sub(self.basic_plan, status=Subscription.STATUS_CANCELLED)
        with self.assertRaises(SubscriptionNotActiveError):
            SubscriptionService.change_plan(
                subscription = sub,
                new_plan_id  = str(self.premium_plan.id),
            )

    def test_proration_credit_calculado_correctamente(self):
        sub = _make_sub(self.basic_plan, days_remaining=15)
        updated = SubscriptionService.change_plan(
            subscription = sub,
            new_plan_id  = str(self.premium_plan.id),
        )
        history = SubscriptionHistory.objects.filter(subscription_id=sub.id).first()
        # crédito ≈ (50 / 30) * 15 ≈ 25.00
        self.assertAlmostEqual(float(history.proration_credit), 25.0, delta=1.5)


class TestRenewSubscription(TestCase):

    def setUp(self):
        self.plan = _make_plan("Pro", price_monthly=Decimal("100"))

    @patch("apps.planes.services.MockPaymentGateway.charge")
    def test_renovacion_exitosa(self, mock_charge):
        mock_charge.return_value = {
            "transaction_id": "tx_ok", "amount": 100,
            "customer_id": None, "description": "",
            "success": True, "error": None,
            "timestamp": timezone.now().isoformat(),
        }
        sub = _make_sub(self.plan, status=Subscription.STATUS_ACTIVE, days_remaining=-1)
        updated = SubscriptionService.renew(sub)

        self.assertEqual(updated.status, Subscription.STATUS_ACTIVE)
        self.assertEqual(updated.payment_retry_count, 0)
        self.assertGreater(updated.current_period_end, timezone.now())

        attempt = PaymentAttempt.objects.filter(subscription_id=sub.id).first()
        self.assertEqual(attempt.status, PaymentAttempt.STATUS_SUCCESS)

        history = SubscriptionHistory.objects.filter(subscription_id=sub.id).first()
        self.assertEqual(history.change_type, SubscriptionHistory.CHANGE_RENEW)

    @patch("apps.planes.services.MockPaymentGateway.charge")
    def test_pago_fallido_marca_past_due(self, mock_charge):
        mock_charge.return_value = {
            "transaction_id": "tx_fail", "amount": 100,
            "customer_id": None, "description": "",
            "success": False, "error": "card_declined",
            "timestamp": timezone.now().isoformat(),
        }
        sub = _make_sub(self.plan, days_remaining=-1)
        updated = SubscriptionService.renew(sub)

        self.assertEqual(updated.status, Subscription.STATUS_PAST_DUE)
        self.assertEqual(updated.payment_retry_count, 1)

        attempt = PaymentAttempt.objects.filter(subscription_id=sub.id).first()
        self.assertEqual(attempt.status, PaymentAttempt.STATUS_FAILED)

    @patch("apps.planes.services.MockPaymentGateway.charge")
    def test_max_reintentos_expira_sub(self, mock_charge):
        mock_charge.return_value = {
            "success": False, "error": "card_declined",
            "transaction_id": "x", "amount": 100,
            "customer_id": None, "description": "",
            "timestamp": timezone.now().isoformat(),
        }
        sub = _make_sub(self.plan, status=Subscription.STATUS_PAST_DUE, days_remaining=-10)
        sub.payment_retry_count = 2  # ya tuvo 2 intentos
        sub.save()

        updated = SubscriptionService.renew(sub)
        self.assertEqual(updated.status, Subscription.STATUS_EXPIRED)


class TestCancelAndReactivate(TestCase):

    def setUp(self):
        self.plan = _make_plan("Básico")
        self.sub  = _make_sub(self.plan, days_remaining=15)

    def test_cancelacion_no_corta_acceso(self):
        updated = SubscriptionService.cancel(self.sub)
        self.assertTrue(updated.cancelled_at_period_end)
        self.assertNotEqual(updated.status, Subscription.STATUS_CANCELLED)
        self.assertIsNotNone(updated.cancelled_at)

        history = SubscriptionHistory.objects.filter(subscription_id=self.sub.id).first()
        self.assertEqual(history.change_type, SubscriptionHistory.CHANGE_CANCEL)

    def test_cancelar_dos_veces_lanza_error(self):
        SubscriptionService.cancel(self.sub)
        self.sub.refresh_from_db()
        self.sub.status = Subscription.STATUS_CANCELLED
        self.sub.save()
        with self.assertRaises(AlreadyCancelledError):
            SubscriptionService.cancel(self.sub)

    def test_reactivacion_exitosa(self):
        SubscriptionService.cancel(self.sub)
        self.sub.refresh_from_db()
        updated = SubscriptionService.reactivate(self.sub)
        self.assertFalse(updated.cancelled_at_period_end)
        self.assertEqual(updated.status, Subscription.STATUS_ACTIVE)
        self.assertIsNone(updated.cancelled_at)

    def test_reactivar_sin_cancelacion_lanza_error(self):
        with self.assertRaises(NotCancelledError):
            SubscriptionService.reactivate(self.sub)

    def test_no_reactivar_despues_de_expirar(self):
        sub = _make_sub(self.plan, days_remaining=-5)
        sub.cancelled_at_period_end = True
        sub.status = Subscription.STATUS_EXPIRED
        sub.save()
        with self.assertRaises(AlreadyCancelledError):
            SubscriptionService.reactivate(sub)
