"""
B-05: Cron diario de renovación automática de suscripciones.

Uso:
  python3 manage.py renovar_suscripciones

Configurar en crontab del servidor:
  0 2 * * * cd /app && python3 manage.py renovar_suscripciones >> /var/log/totem/cron.log 2>&1

O con Celery Beat:
  CELERY_BEAT_SCHEDULE = {
      'renovar-suscripciones': {
          'task': 'apps.planes.tasks.renovar_suscripciones_task',
          'schedule': crontab(hour=2, minute=0),
      },
  }
"""
import logging

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.planes.models import Subscription
from apps.planes.services import SubscriptionService

logger = logging.getLogger("planes.cron")


class Command(BaseCommand):
    help = "Renovación automática de suscripciones vencidas (B-05)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simula el proceso sin modificar la BD.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        now     = timezone.now()
        self.stdout.write(f"[{now.isoformat()}] Iniciando renovación de suscripciones...")

        # ── 1. Renovar suscripciones activas/trialing vencidas ────────────────
        to_renew = Subscription.objects.filter(
            status__in=[Subscription.STATUS_ACTIVE, Subscription.STATUS_TRIALING],
            current_period_end__lte=now,
            cancelled_at_period_end=False,
        )
        self.stdout.write(f"  → {to_renew.count()} suscripciones a renovar.")

        renewed = failed = 0
        for sub in to_renew:
            if dry_run:
                self.stdout.write(f"  [DRY-RUN] Renovaría sub={sub.id} tenant={sub.tenant_id}")
                continue
            try:
                updated = SubscriptionService.renew(sub)
                if updated.status == Subscription.STATUS_ACTIVE:
                    renewed += 1
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Renovada sub={sub.id}"))
                else:
                    failed += 1
                    self.stdout.write(self.style.WARNING(f"  ✗ Pago fallido sub={sub.id} [{updated.status}]"))
            except Exception as exc:
                failed += 1
                logger.exception("Error renovando sub=%s: %s", sub.id, exc)
                self.stdout.write(self.style.ERROR(f"  ✗ Error sub={sub.id}: {exc}"))

        # ── 2. Reintentar past_due dentro del límite de intentos ─────────────
        past_due = Subscription.objects.filter(
            status=Subscription.STATUS_PAST_DUE,
            cancelled_at_period_end=False,
        )
        self.stdout.write(f"  → {past_due.count()} suscripciones past_due para reintento.")

        for sub in past_due:
            if dry_run:
                self.stdout.write(f"  [DRY-RUN] Reintentaría pago sub={sub.id}")
                continue
            try:
                SubscriptionService.renew(sub)
            except Exception as exc:
                logger.exception("Error reintentando sub=%s: %s", sub.id, exc)

        # ── 3. Expirar suscripciones canceladas al período ───────────────────
        to_expire = Subscription.objects.filter(
            cancelled_at_period_end=True,
            current_period_end__lte=now,
        ).exclude(status__in=[Subscription.STATUS_EXPIRED, Subscription.STATUS_CANCELLED])

        self.stdout.write(f"  → {to_expire.count()} suscripciones a expirar.")
        expired_count = 0
        for sub in to_expire:
            if dry_run:
                self.stdout.write(f"  [DRY-RUN] Expiraría sub={sub.id}")
                continue
            try:
                with transaction.atomic():
                    sub.status = Subscription.STATUS_EXPIRED
                    sub.save(update_fields=["status", "updated_at"])
                    from apps.planes.models import SubscriptionHistory
                    SubscriptionHistory.objects.create(
                        subscription_id = sub.id,
                        tenant_id       = sub.tenant_id,
                        old_plan_id     = sub.plan_id,
                        new_plan_id     = sub.plan_id,
                        old_status      = Subscription.STATUS_CANCELLED,
                        new_status      = Subscription.STATUS_EXPIRED,
                        change_type     = SubscriptionHistory.CHANGE_EXPIRE,
                        notes           = "Expirada automáticamente al fin del período.",
                    )
                    expired_count += 1
                    self.stdout.write(f"  ✓ Expirada sub={sub.id}")
            except Exception as exc:
                logger.exception("Error expirando sub=%s: %s", sub.id, exc)

        # ── Resumen ───────────────────────────────────────────────────────────
        end = timezone.now()
        duration = (end - now).total_seconds()
        summary = (
            f"\n[{end.isoformat()}] Cron finalizado en {duration:.2f}s\n"
            f"  Renovadas: {renewed} | Fallidas: {failed} | Expiradas: {expired_count}"
        )
        self.stdout.write(self.style.SUCCESS(summary))
        logger.info(summary)
