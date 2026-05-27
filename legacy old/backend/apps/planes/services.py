"""
SubscriptionService — Capa de negocio para el ciclo de suscripciones.

Implementa B-04 (cambio de plan), B-05 (renovación automática),
B-06 (cancelación/reactivación) siguiendo principios SOLID.

Ningún ORM query vive en los controllers: todo pasa por aquí.
"""
import logging
import random
import uuid
from decimal import Decimal
from typing import Optional

from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.planes.models import (
    PaymentAttempt,
    Plan,
    Subscription,
    SubscriptionHistory,
)

logger = logging.getLogger("planes.subscription")

MAX_PAYMENT_RETRIES = 3
RETRY_COOLDOWN_HOURS = 24  # horas entre reintentos de pago


# ─────────────────────────────────────────────────────────────────────────────
# Excepciones de dominio
# ─────────────────────────────────────────────────────────────────────────────

class SubscriptionError(Exception):
    """Error base del dominio de suscripciones."""
    pass


class PlanNotFoundError(SubscriptionError):
    pass


class SubscriptionNotActiveError(SubscriptionError):
    pass


class SamePlanError(SubscriptionError):
    pass


class AlreadyCancelledError(SubscriptionError):
    pass


class NotCancelledError(SubscriptionError):
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Mock Payment Gateway
# ─────────────────────────────────────────────────────────────────────────────

class MockPaymentGateway:
    """
    Simula integración con pasarela de pagos.
    En producción se reemplaza por el cliente real de Stripe/MercadoPago.
    80% éxito para demo; configurable vía PAYMENT_SUCCESS_RATE en settings.
    """

    SUCCESS_RATE = getattr(settings, "PAYMENT_SUCCESS_RATE", 0.80)

    @classmethod
    def charge(cls, amount: Decimal, customer_id: Optional[str], description: str) -> dict:
        success = random.random() < cls.SUCCESS_RATE
        return {
            "transaction_id": str(uuid.uuid4()),
            "amount": float(amount),
            "customer_id": customer_id,
            "description": description,
            "success": success,
            "error": None if success else "card_declined",
            "timestamp": timezone.now().isoformat(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# SubscriptionService
# ─────────────────────────────────────────────────────────────────────────────

class SubscriptionService:

    # ── B-04: Cambio de plan ─────────────────────────────────────────────────

    @staticmethod
    @transaction.atomic
    def change_plan(
        subscription: Subscription,
        new_plan_id: str,
        changed_by_id: Optional[str] = None,
        billing_cycle: Optional[str] = None,
        downgrade_at_period_end: bool = False,
    ) -> Subscription:
        """
        Cambia el plan de una suscripción.

        Upgrade → inmediato + prorrateo de crédito.
        Downgrade → inmediato o al próximo ciclo según downgrade_at_period_end.
        """
        if subscription.status not in {
            Subscription.STATUS_ACTIVE,
            Subscription.STATUS_TRIALING,
            Subscription.STATUS_PAST_DUE,
        }:
            raise SubscriptionNotActiveError("La suscripción no está activa.")

        new_plan = Plan.objects.filter(id=new_plan_id, is_active=True).first()
        if not new_plan:
            raise PlanNotFoundError(f"Plan '{new_plan_id}' no existe o está inactivo.")

        if str(subscription.plan_id) == str(new_plan_id):
            raise SamePlanError("El tenant ya está en este plan.")

        old_plan = Plan.objects.filter(id=subscription.plan_id).first()
        old_cycle = billing_cycle or subscription.billing_cycle

        # Determinar si es upgrade o downgrade
        old_price = old_plan.price_for_cycle(old_cycle) if old_plan else Decimal("0")
        new_price  = new_plan.price_for_cycle(old_cycle)
        is_upgrade = new_price > old_price
        change_type = SubscriptionHistory.CHANGE_UPGRADE if is_upgrade else SubscriptionHistory.CHANGE_DOWNGRADE

        proration_credit = None
        notes = ""

        if is_upgrade:
            # Prorrateo: crédito por días restantes del plan actual
            proration_credit = SubscriptionService._calculate_proration_credit(
                subscription, old_price
            )
            notes = (
                f"Upgrade de '{getattr(old_plan,'nombre','?')}' → '{new_plan.nombre}'. "
                f"Crédito prorrateo: ${proration_credit:.2f}"
            )
            subscription.plan_id      = uuid.UUID(str(new_plan_id))
            subscription.billing_cycle = old_cycle
            subscription.status       = Subscription.STATUS_ACTIVE
            subscription.payment_retry_count = 0

        elif downgrade_at_period_end:
            # Downgrade programado — no cambia el plan ahora
            notes = (
                f"Downgrade programado de '{getattr(old_plan,'nombre','?')}' → '{new_plan.nombre}'. "
                f"Efectivo al: {subscription.current_period_end.date()}"
            )
            # Guardamos el nuevo plan en las notas; el cron lo aplicará al renovar
            # Usamos un campo JSON en notes como señal (producción usaría un campo dedicado)
            notes = f"__PENDING_DOWNGRADE__{new_plan_id}__" + notes

        else:
            # Downgrade inmediato
            notes = f"Downgrade inmediato de '{getattr(old_plan,'nombre','?')}' → '{new_plan.nombre}'."
            subscription.plan_id       = uuid.UUID(str(new_plan_id))
            subscription.billing_cycle = old_cycle

        if billing_cycle:
            subscription.billing_cycle = billing_cycle

        subscription.save()

        # Registrar historial
        SubscriptionHistory.objects.create(
            subscription_id = subscription.id,
            tenant_id       = subscription.tenant_id,
            old_plan_id     = old_plan.id if old_plan else None,
            new_plan_id     = new_plan.id,
            old_status      = subscription.status,
            new_status      = subscription.status,
            change_type     = change_type,
            changed_by      = changed_by_id,
            proration_credit = proration_credit,
            effective_date  = timezone.now(),
            notes           = notes,
        )

        logger.info(
            "Plan cambiado | tenant=%s sub=%s %s → %s credit=%s",
            subscription.tenant_id, subscription.id,
            getattr(old_plan, "nombre", "?"), new_plan.nombre, proration_credit,
        )
        return subscription

    @staticmethod
    def _calculate_proration_credit(sub: Subscription, daily_rate_base: Decimal) -> Decimal:
        """Crédito = precio_diario × días_restantes."""
        days_remaining = max(0, (sub.current_period_end - timezone.now()).days)
        cycle_days     = sub.cycle_days()
        if cycle_days == 0:
            return Decimal("0")
        daily_rate = daily_rate_base / Decimal(cycle_days)
        return (daily_rate * Decimal(days_remaining)).quantize(Decimal("0.01"))

    # ── B-05: Renovación automática ──────────────────────────────────────────

    @staticmethod
    @transaction.atomic
    def renew(subscription: Subscription) -> Subscription:
        """
        Intenta renovar una suscripción vencida.
        Llamado por el cron diario.
        """
        plan = Plan.objects.filter(id=subscription.plan_id).first()
        if not plan:
            logger.error("Plan no encontrado para sub=%s", subscription.id)
            return subscription

        amount = plan.price_for_cycle(subscription.billing_cycle)
        attempt_number = subscription.payment_retry_count + 1

        # Evitar duplicidad: no reintentar si ya se cobró hoy
        if (
            subscription.last_payment_attempt_at
            and (timezone.now() - subscription.last_payment_attempt_at).total_seconds()
            < RETRY_COOLDOWN_HOURS * 3600
        ):
            logger.info("Reintento demasiado pronto para sub=%s, saltando.", subscription.id)
            return subscription

        # Llamar pasarela
        gw = MockPaymentGateway.charge(
            amount=amount,
            customer_id=subscription.stripe_customer_id,
            description=f"Renovación {plan.nombre} - tenant {subscription.tenant_id}",
        )

        # Registrar intento
        PaymentAttempt.objects.create(
            subscription_id  = subscription.id,
            tenant_id        = subscription.tenant_id,
            amount           = amount,
            status           = PaymentAttempt.STATUS_SUCCESS if gw["success"] else PaymentAttempt.STATUS_FAILED,
            attempt_number   = attempt_number,
            gateway_response = gw,
            error_message    = gw.get("error") or "",
        )

        subscription.last_payment_attempt_at = timezone.now()
        subscription.payment_retry_count     = attempt_number

        if gw["success"]:
            old_status = subscription.status
            now = timezone.now()
            subscription.current_period_start = now
            subscription.current_period_end   = now + timezone.timedelta(days=subscription.cycle_days())
            subscription.status               = Subscription.STATUS_ACTIVE
            subscription.payment_retry_count  = 0
            subscription.save()

            SubscriptionHistory.objects.create(
                subscription_id = subscription.id,
                tenant_id       = subscription.tenant_id,
                old_plan_id     = subscription.plan_id,
                new_plan_id     = subscription.plan_id,
                old_status      = old_status,
                new_status      = Subscription.STATUS_ACTIVE,
                change_type     = SubscriptionHistory.CHANGE_RENEW,
                effective_date  = now,
                notes           = f"Renovación exitosa. tx={gw['transaction_id']}",
            )
            SubscriptionService._send_renewal_email(subscription, plan, success=True)
            logger.info("Renovación exitosa sub=%s tenant=%s", subscription.id, subscription.tenant_id)

        else:
            old_status = subscription.status
            subscription.status = Subscription.STATUS_PAST_DUE
            subscription.save()

            SubscriptionHistory.objects.create(
                subscription_id = subscription.id,
                tenant_id       = subscription.tenant_id,
                old_plan_id     = subscription.plan_id,
                new_plan_id     = subscription.plan_id,
                old_status      = old_status,
                new_status      = Subscription.STATUS_PAST_DUE,
                change_type     = SubscriptionHistory.CHANGE_PAST_DUE,
                effective_date  = timezone.now(),
                notes           = f"Pago fallido. intento={attempt_number} error={gw.get('error')}",
            )
            SubscriptionService._send_renewal_email(subscription, plan, success=False)
            logger.warning(
                "Pago fallido sub=%s intento=%s/%s",
                subscription.id, attempt_number, MAX_PAYMENT_RETRIES,
            )

            # Si superó reintentos → expirar
            if attempt_number >= MAX_PAYMENT_RETRIES:
                SubscriptionService._expire(subscription)

        return subscription

    @staticmethod
    @transaction.atomic
    def _expire(subscription: Subscription) -> None:
        subscription.status = Subscription.STATUS_EXPIRED
        subscription.save(update_fields=["status", "updated_at"])
        SubscriptionHistory.objects.create(
            subscription_id = subscription.id,
            tenant_id       = subscription.tenant_id,
            old_status      = Subscription.STATUS_PAST_DUE,
            new_status      = Subscription.STATUS_EXPIRED,
            change_type     = SubscriptionHistory.CHANGE_EXPIRE,
            notes           = "Expirada por reintentos de pago agotados.",
        )
        logger.warning("Suscripción EXPIRADA sub=%s tenant=%s", subscription.id, subscription.tenant_id)

    # ── B-06: Cancelación y reactivación ────────────────────────────────────

    @staticmethod
    @transaction.atomic
    def cancel(subscription: Subscription, changed_by_id: Optional[str] = None) -> Subscription:
        """
        Cancela al final del período — no corta el acceso inmediatamente.
        cancelled_at_period_end = True mantiene el acceso hasta current_period_end.
        """
        if subscription.status in {Subscription.STATUS_CANCELLED, Subscription.STATUS_EXPIRED}:
            raise AlreadyCancelledError("La suscripción ya está cancelada o expirada.")

        old_status = subscription.status
        subscription.cancelled_at_period_end = True
        subscription.cancelled_at = timezone.now()
        # El acceso se mantiene; el cron la expirará en current_period_end
        subscription.save(update_fields=["cancelled_at_period_end", "cancelled_at", "updated_at"])

        SubscriptionHistory.objects.create(
            subscription_id = subscription.id,
            tenant_id       = subscription.tenant_id,
            old_plan_id     = subscription.plan_id,
            new_plan_id     = subscription.plan_id,
            old_status      = old_status,
            new_status      = subscription.status,
            change_type     = SubscriptionHistory.CHANGE_CANCEL,
            changed_by      = changed_by_id,
            effective_date  = timezone.now(),
            notes           = (
                f"Cancelación programada. Acceso hasta: {subscription.current_period_end.date()}. "
                "No se realizarán más cobros."
            ),
        )
        logger.info("Suscripción cancelada (period_end) sub=%s", subscription.id)
        return subscription

    @staticmethod
    @transaction.atomic
    def reactivate(subscription: Subscription, changed_by_id: Optional[str] = None) -> Subscription:
        """
        Reactiva una suscripción cancelada antes de que expire.
        Solo válido si aún no llegó current_period_end.
        """
        if not subscription.cancelled_at_period_end:
            raise NotCancelledError("La suscripción no está pendiente de cancelación.")
        if subscription.status == Subscription.STATUS_EXPIRED:
            raise AlreadyCancelledError("La suscripción ya expiró y no puede reactivarse.")
        if subscription.current_period_end < timezone.now():
            raise AlreadyCancelledError("El período ya terminó; no es posible reactivar.")

        old_status = subscription.status
        subscription.cancelled_at_period_end = False
        subscription.cancelled_at = None
        subscription.status = Subscription.STATUS_ACTIVE
        subscription.save(update_fields=["cancelled_at_period_end", "cancelled_at", "status", "updated_at"])

        SubscriptionHistory.objects.create(
            subscription_id = subscription.id,
            tenant_id       = subscription.tenant_id,
            old_status      = old_status,
            new_status      = Subscription.STATUS_ACTIVE,
            change_type     = SubscriptionHistory.CHANGE_REACTIVATE,
            changed_by      = changed_by_id,
            notes           = "Reactivación antes del vencimiento del período.",
        )
        logger.info("Suscripción reactivada sub=%s tenant=%s", subscription.id, subscription.tenant_id)
        return subscription

    # ── Email notifications ──────────────────────────────────────────────────

    @staticmethod
    def _send_renewal_email(subscription: Subscription, plan: Plan, success: bool) -> None:
        from apps.usuarios.models import Perfil
        admin = (
            Perfil.objects
            .filter(tenant_id=subscription.tenant_id, rol__in=["admin", "superadmin"])
            .order_by("-created_at")
            .first()
        )
        if not admin or not admin.email:
            return

        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@totemhub.com")

        if success:
            subject = f"[ToTem HUB] Renovación exitosa — {plan.nombre}"
            body = (
                f"Hola {admin.nombre or 'Admin'},\n\n"
                f"Tu suscripción al plan **{plan.nombre}** fue renovada exitosamente.\n"
                f"Próxima renovación: {subscription.current_period_end.strftime('%d/%m/%Y')}.\n\n"
                f"Gracias por seguir con nosotros.\n— ToTem HUB"
            )
        else:
            subject = f"[ToTem HUB] Fallo de pago — acción requerida"
            body = (
                f"Hola {admin.nombre or 'Admin'},\n\n"
                f"No pudimos procesar el pago de tu suscripción al plan **{plan.nombre}**.\n"
                f"Por favor actualiza tu método de pago antes del "
                f"{subscription.current_period_end.strftime('%d/%m/%Y')} "
                f"para no perder el acceso.\n\n"
                f"— ToTem HUB"
            )

        try:
            send_mail(subject, body, from_email, [admin.email], fail_silently=True)
        except Exception as exc:
            logger.warning("Error enviando email a %s: %s", admin.email, exc)

    # ── Helpers de consulta (B-07) ───────────────────────────────────────────

    @staticmethod
    def get_admin_queryset(requesting_role: str, tenant_id=None):
        """Devuelve el queryset correcto según el rol del solicitante."""
        qs = Subscription.objects.select_related().all()
        if requesting_role == "superadmin":
            return qs  # ve todo
        if requesting_role == "admin" and tenant_id:
            return qs.filter(tenant_id=tenant_id)
        return Subscription.objects.none()
