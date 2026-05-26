import uuid
from decimal import Decimal

from django.db import models
from django.utils import timezone


class Plan(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre         = models.CharField(max_length=120)
    description    = models.TextField(blank=True, default="")
    price_monthly  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_yearly   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_trips      = models.IntegerField(null=True, blank=True)
    max_inscriptions = models.IntegerField(null=True, blank=True)
    features       = models.JSONField(default=list, blank=True)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField()

    class Meta:
        managed  = False
        db_table = "plans"

    def __str__(self):
        return self.nombre

    def price_for_cycle(self, cycle: str) -> Decimal:
        if cycle == "yearly":
            return self.price_yearly or Decimal("0")
        return self.price_monthly or Decimal("0")


class Subscription(models.Model):
    STATUS_ACTIVE    = "active"
    STATUS_TRIALING  = "trialing"
    STATUS_PAST_DUE  = "past_due"
    STATUS_CANCELLED = "cancelled"
    STATUS_EXPIRED   = "expired"

    STATUS_CHOICES = [
        (STATUS_ACTIVE,    "Activo"),
        (STATUS_TRIALING,  "En prueba"),
        (STATUS_PAST_DUE,  "Pago pendiente"),
        (STATUS_CANCELLED, "Cancelado"),
        (STATUS_EXPIRED,   "Expirado"),
    ]

    CYCLE_MONTHLY = "monthly"
    CYCLE_YEARLY  = "yearly"
    CYCLE_CHOICES = [
        (CYCLE_MONTHLY, "Mensual"),
        (CYCLE_YEARLY,  "Anual"),
    ]

    id                       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id                = models.UUIDField(db_index=True)
    plan_id                  = models.UUIDField()
    status                   = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_TRIALING)
    billing_cycle            = models.CharField(max_length=10, choices=CYCLE_CHOICES, default=CYCLE_MONTHLY)
    current_period_start     = models.DateTimeField()
    current_period_end       = models.DateTimeField()
    # B-06: cancel at period end (no cortar acceso inmediatamente)
    cancelled_at_period_end  = models.BooleanField(default=False)
    cancelled_at             = models.DateTimeField(null=True, blank=True)
    # B-05: retry logic
    payment_retry_count      = models.IntegerField(default=0)
    last_payment_attempt_at  = models.DateTimeField(null=True, blank=True)
    # Stripe
    stripe_subscription_id   = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    stripe_customer_id       = models.CharField(max_length=255, null=True, blank=True)
    created_at               = models.DateTimeField(auto_now_add=True)
    updated_at               = models.DateTimeField(auto_now=True)

    class Meta:
        managed  = True
        db_table = "subscriptions"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["status", "current_period_end"]),
        ]

    def __str__(self):
        return f"Sub tenant={self.tenant_id} [{self.status}]"

    @property
    def is_billable(self) -> bool:
        return self.status in {self.STATUS_ACTIVE, self.STATUS_TRIALING, self.STATUS_PAST_DUE}

    @property
    def days_remaining(self) -> int:
        delta = self.current_period_end - timezone.now()
        return max(0, delta.days)

    def cycle_days(self) -> int:
        return 365 if self.billing_cycle == self.CYCLE_YEARLY else 30


class SubscriptionHistory(models.Model):
    """Auditoría completa de cambios de suscripción (B-04, B-05, B-06)."""
    CHANGE_CREATE     = "create"
    CHANGE_UPGRADE    = "upgrade"
    CHANGE_DOWNGRADE  = "downgrade"
    CHANGE_RENEW      = "renew"
    CHANGE_CANCEL     = "cancel"
    CHANGE_REACTIVATE = "reactivate"
    CHANGE_EXPIRE     = "expire"
    CHANGE_PAST_DUE   = "past_due"

    CHANGE_CHOICES = [
        (CHANGE_CREATE,     "Creación"),
        (CHANGE_UPGRADE,    "Upgrade de plan"),
        (CHANGE_DOWNGRADE,  "Downgrade de plan"),
        (CHANGE_RENEW,      "Renovación automática"),
        (CHANGE_CANCEL,     "Cancelación"),
        (CHANGE_REACTIVATE, "Reactivación"),
        (CHANGE_EXPIRE,     "Expiración"),
        (CHANGE_PAST_DUE,   "Pago fallido"),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription_id  = models.UUIDField(db_index=True)
    tenant_id        = models.UUIDField(db_index=True)
    old_plan_id      = models.UUIDField(null=True, blank=True)
    new_plan_id      = models.UUIDField(null=True, blank=True)
    old_status       = models.CharField(max_length=20, blank=True, default="")
    new_status       = models.CharField(max_length=20, blank=True, default="")
    change_type      = models.CharField(max_length=20, choices=CHANGE_CHOICES)
    changed_by       = models.UUIDField(null=True, blank=True)
    proration_credit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    effective_date   = models.DateTimeField(default=timezone.now)
    notes            = models.TextField(blank=True, default="")
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = True
        db_table = "subscription_history"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.change_type} sub={self.subscription_id}"


class PaymentAttempt(models.Model):
    """Registro de cada intento de cobro — usado por el cron de renovación (B-05)."""
    STATUS_SUCCESS = "success"
    STATUS_FAILED  = "failed"
    STATUS_PENDING = "pending"

    STATUS_CHOICES = [
        (STATUS_SUCCESS, "Exitoso"),
        (STATUS_FAILED,  "Fallido"),
        (STATUS_PENDING, "Pendiente"),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription_id  = models.UUIDField(db_index=True)
    tenant_id        = models.UUIDField()
    amount           = models.DecimalField(max_digits=10, decimal_places=2)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    attempt_number   = models.IntegerField(default=1)
    gateway_response = models.JSONField(default=dict)
    error_message    = models.CharField(max_length=500, blank=True, default="")
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = True
        db_table = "payment_attempts"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["subscription_id", "status"]),
        ]

    def __str__(self):
        return f"Pago #{self.attempt_number} sub={self.subscription_id} [{self.status}]"
