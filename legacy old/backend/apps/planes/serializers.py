from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from apps.planes.models import PaymentAttempt, Plan, Subscription, SubscriptionHistory


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Plan
        fields = [
            "id", "nombre", "description",
            "price_monthly", "price_yearly",
            "max_trips", "max_inscriptions",
            "features", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    @staticmethod
    def _validate_limit(value, field_name: str):
        if value is not None and value < 0:
            raise serializers.ValidationError({field_name: ["Debe ser mayor o igual a 0."]})

    def validate_features(self, value):
        if value in (None, ""):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("features debe ser una lista JSON.")
        if not all(isinstance(item, str) and item.strip() for item in value):
            raise serializers.ValidationError("Cada feature debe ser un texto no vacío.")
        return [item.strip() for item in value]

    def validate(self, attrs):
        self._validate_limit(attrs.get("max_trips"), "max_trips")
        self._validate_limit(attrs.get("max_inscriptions"), "max_inscriptions")
        return attrs

    def create(self, validated_data):
        plan = Plan(**validated_data)
        if not getattr(plan, "created_at", None):
            plan.created_at = timezone.now()
        plan.save()
        return plan


class SubscriptionSerializer(serializers.ModelSerializer):
    is_active         = serializers.BooleanField(read_only=True)
    is_billable       = serializers.BooleanField(read_only=True)
    days_remaining    = serializers.IntegerField(read_only=True)
    plan_name         = serializers.SerializerMethodField()
    plan_features     = serializers.SerializerMethodField()

    class Meta:
        model  = Subscription
        fields = [
            "id", "tenant_id", "plan_id", "plan_name", "plan_features",
            "status", "billing_cycle",
            "current_period_start", "current_period_end",
            "cancelled_at_period_end", "cancelled_at",
            "payment_retry_count", "last_payment_attempt_at",
            "stripe_subscription_id", "stripe_customer_id",
            "is_active", "is_billable", "days_remaining",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "stripe_subscription_id", "stripe_customer_id",
            "payment_retry_count", "last_payment_attempt_at",
            "cancelled_at", "created_at", "updated_at",
        ]

    def get_plan_name(self, obj) -> str | None:
        plan = Plan.objects.filter(id=obj.plan_id).first()
        return plan.nombre if plan else None

    def get_plan_features(self, obj) -> list:
        plan = Plan.objects.filter(id=obj.plan_id).first()
        return plan.features if plan else []


class ChangePlanSerializer(serializers.Serializer):
    """DTO para B-04 PATCH /subscriptions/:id/plan"""
    plan_id                 = serializers.UUIDField()
    billing_cycle           = serializers.ChoiceField(
        choices=["monthly", "yearly"], required=False, default=None, allow_null=True
    )
    downgrade_at_period_end = serializers.BooleanField(default=False)

    def validate_plan_id(self, value):
        if not Plan.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Plan no encontrado o inactivo.")
        return value


class CancelSubscriptionSerializer(serializers.Serializer):
    """DTO para B-06 POST /subscriptions/:id/cancelar"""
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")


class SubscriptionHistorySerializer(serializers.ModelSerializer):
    old_plan_name = serializers.SerializerMethodField()
    new_plan_name = serializers.SerializerMethodField()

    class Meta:
        model  = SubscriptionHistory
        fields = [
            "id", "subscription_id", "tenant_id",
            "old_plan_id", "old_plan_name",
            "new_plan_id", "new_plan_name",
            "old_status", "new_status", "change_type",
            "changed_by", "proration_credit",
            "effective_date", "notes", "created_at",
        ]
        read_only_fields = fields

    def get_old_plan_name(self, obj) -> str | None:
        if not obj.old_plan_id:
            return None
        p = Plan.objects.filter(id=obj.old_plan_id).first()
        return p.nombre if p else None

    def get_new_plan_name(self, obj) -> str | None:
        if not obj.new_plan_id:
            return None
        p = Plan.objects.filter(id=obj.new_plan_id).first()
        return p.nombre if p else None


class PaymentAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PaymentAttempt
        fields = [
            "id", "subscription_id", "tenant_id",
            "amount", "status", "attempt_number",
            "error_message", "created_at",
        ]
        read_only_fields = fields


class AdminSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer enriquecido para el dashboard de superadmin (B-07)."""
    plan_name        = serializers.SerializerMethodField()
    days_remaining   = serializers.IntegerField(read_only=True)
    is_active        = serializers.BooleanField(read_only=True)
    history_count    = serializers.SerializerMethodField()
    last_payment     = serializers.SerializerMethodField()

    class Meta:
        model  = Subscription
        fields = [
            "id", "tenant_id", "plan_id", "plan_name",
            "status", "billing_cycle",
            "current_period_start", "current_period_end", "days_remaining",
            "cancelled_at_period_end", "cancelled_at",
            "payment_retry_count",
            "is_active", "history_count", "last_payment",
            "stripe_customer_id",
            "created_at", "updated_at",
        ]

    def get_plan_name(self, obj) -> str | None:
        p = Plan.objects.filter(id=obj.plan_id).first()
        return p.nombre if p else None

    def get_history_count(self, obj) -> int:
        return SubscriptionHistory.objects.filter(subscription_id=obj.id).count()

    def get_last_payment(self, obj) -> dict | None:
        attempt = (
            PaymentAttempt.objects.filter(subscription_id=obj.id)
            .order_by("-created_at").first()
        )
        if not attempt:
            return None
        return {
            "status": attempt.status,
            "amount": float(attempt.amount),
            "attempt_number": attempt.attempt_number,
            "created_at": attempt.created_at.isoformat(),
        }
