"""
Controllers para el módulo de suscripciones.
Delegan toda la lógica de negocio a SubscriptionService.
"""
import os
import logging

from django.conf import settings
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters as drf_filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.planes.models import (
    PaymentAttempt,
    Plan,
    Subscription,
    SubscriptionHistory,
)
from apps.planes.serializers import (
    AdminSubscriptionSerializer,
    CancelSubscriptionSerializer,
    ChangePlanSerializer,
    PaymentAttemptSerializer,
    PlanSerializer,
    SubscriptionHistorySerializer,
    SubscriptionSerializer,
)
from apps.planes.services import (
    AlreadyCancelledError,
    NotCancelledError,
    PlanNotFoundError,
    SamePlanError,
    SubscriptionError,
    SubscriptionNotActiveError,
    SubscriptionService,
)
from apps.usuarios.rbac import (
    ROLE_ADMIN,
    ROLE_SUPERADMIN,
    get_request_profile,
    get_request_raw_role,
)

logger = logging.getLogger("planes.views")


# ─────────────────────────────────────────────────────────────────────────────
# RBAC Guards
# ─────────────────────────────────────────────────────────────────────────────

class PlanAdminPermission(BasePermission):
    message = "No tienes permisos para administrar planes SaaS."

    def has_permission(self, request, _view):
        return bool(
            request.user
            and getattr(request.user, "is_authenticated", False)
            and get_request_raw_role(request) in {ROLE_SUPERADMIN, ROLE_ADMIN}
        )


class SuperAdminOnlyPermission(BasePermission):
    message = "Solo superadmins pueden acceder a este recurso."

    def has_permission(self, request, _view):
        return bool(
            request.user
            and getattr(request.user, "is_authenticated", False)
            and get_request_raw_role(request) == ROLE_SUPERADMIN
        )


def _get_subscription_or_404(pk, requesting_role: str, tenant_id=None) -> Subscription:
    """Obtiene la suscripción respetando el scope del rol."""
    try:
        sub = Subscription.objects.get(pk=pk)
    except Subscription.DoesNotExist:
        raise NotFound("Suscripción no encontrada.")
    if requesting_role != ROLE_SUPERADMIN and str(sub.tenant_id) != str(tenant_id):
        raise PermissionDenied("No tienes acceso a esta suscripción.")
    return sub


# ─────────────────────────────────────────────────────────────────────────────
# Plans CRUD
# ─────────────────────────────────────────────────────────────────────────────

class PlanViewSet(viewsets.ModelViewSet):
    permission_classes    = [IsAuthenticated, PlanAdminPermission]
    serializer_class      = PlanSerializer
    queryset              = Plan.objects.all().order_by("nombre")
    http_method_names     = ["get", "post", "put", "patch", "delete", "head", "options"]
    filter_backends       = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields      = ["is_active"]
    search_fields         = ["nombre", "description"]
    ordering_fields       = ["created_at", "nombre", "price_monthly", "price_yearly"]
    ordering              = ["nombre"]


# ─────────────────────────────────────────────────────────────────────────────
# Subscription ViewSet — B-04, B-06
# ─────────────────────────────────────────────────────────────────────────────

class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    Gestión de suscripciones del tenant autenticado.

    Endpoints clave:
      PATCH /{id}/plan/         → B-04 cambio de plan
      POST  /{id}/cancelar/     → B-06 cancelación al período
      POST  /{id}/reactivar/    → B-06 reactivación
      GET   /{id}/historial/    → auditoría de cambios
      GET   /{id}/pagos/        → intentos de cobro
    """
    serializer_class  = SubscriptionSerializer
    permission_classes = [IsAuthenticated, PlanAdminPermission]
    http_method_names  = ["get", "post", "put", "patch", "delete", "head", "options"]
    filter_backends    = [DjangoFilterBackend, OrderingFilter]
    filterset_fields   = ["status", "billing_cycle"]
    ordering_fields    = ["created_at", "current_period_end"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        role      = get_request_raw_role(self.request)
        perfil    = get_request_profile(self.request)
        tenant_id = getattr(perfil, "tenant_id", None)
        return SubscriptionService.get_admin_queryset(role, tenant_id)

    def perform_create(self, serializer):
        perfil    = get_request_profile(self.request)
        tenant_id = getattr(perfil, "tenant_id", None)
        now  = timezone.now()
        cycle = self.request.data.get("billing_cycle", Subscription.CYCLE_MONTHLY)
        end  = now + timezone.timedelta(days=365 if cycle == Subscription.CYCLE_YEARLY else 30)
        sub = serializer.save(
            tenant_id            = tenant_id,
            current_period_start = now,
            current_period_end   = end,
        )
        SubscriptionHistory.objects.create(
            subscription_id = sub.id,
            tenant_id       = sub.tenant_id,
            new_plan_id     = sub.plan_id,
            new_status      = sub.status,
            change_type     = SubscriptionHistory.CHANGE_CREATE,
            changed_by      = getattr(perfil, "id", None),
            notes           = "Suscripción creada.",
        )

    # ── B-04: Cambio de plan ─────────────────────────────────────────────────

    @action(detail=True, methods=["patch"], url_path="plan")
    def change_plan(self, request, pk=None):
        """PATCH /api/subscriptions/{id}/plan/"""
        role      = get_request_raw_role(request)
        perfil    = get_request_profile(request)
        tenant_id = getattr(perfil, "tenant_id", None)
        sub = _get_subscription_or_404(pk, role, tenant_id)

        dto = ChangePlanSerializer(data=request.data)
        dto.is_valid(raise_exception=True)

        try:
            updated = SubscriptionService.change_plan(
                subscription            = sub,
                new_plan_id             = str(dto.validated_data["plan_id"]),
                changed_by_id           = str(getattr(perfil, "id", "") or ""),
                billing_cycle           = dto.validated_data.get("billing_cycle"),
                downgrade_at_period_end = dto.validated_data["downgrade_at_period_end"],
            )
        except (PlanNotFoundError, SamePlanError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except SubscriptionNotActiveError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)

        return Response(SubscriptionSerializer(updated).data)

    # ── B-06: Cancelar ───────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="cancelar")
    def cancelar(self, request, pk=None):
        """POST /api/subscriptions/{id}/cancelar/"""
        role      = get_request_raw_role(request)
        perfil    = get_request_profile(request)
        tenant_id = getattr(perfil, "tenant_id", None)
        sub = _get_subscription_or_404(pk, role, tenant_id)

        dto = CancelSubscriptionSerializer(data=request.data)
        dto.is_valid(raise_exception=True)

        try:
            updated = SubscriptionService.cancel(
                subscription  = sub,
                changed_by_id = str(getattr(perfil, "id", "") or ""),
            )
        except AlreadyCancelledError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)

        return Response({
            "detail": (
                f"Suscripción cancelada. Acceso disponible hasta "
                f"{updated.current_period_end.strftime('%d/%m/%Y')}."
            ),
            "subscription": SubscriptionSerializer(updated).data,
        })

    # ── B-06: Reactivar ──────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="reactivar")
    def reactivar(self, request, pk=None):
        """POST /api/subscriptions/{id}/reactivar/"""
        role      = get_request_raw_role(request)
        perfil    = get_request_profile(request)
        tenant_id = getattr(perfil, "tenant_id", None)
        sub = _get_subscription_or_404(pk, role, tenant_id)

        try:
            updated = SubscriptionService.reactivate(
                subscription  = sub,
                changed_by_id = str(getattr(perfil, "id", "") or ""),
            )
        except (AlreadyCancelledError, NotCancelledError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)

        return Response({
            "detail": "Suscripción reactivada exitosamente.",
            "subscription": SubscriptionSerializer(updated).data,
        })

    # ── Auditoría ────────────────────────────────────────────────────────────

    @action(detail=True, methods=["get"], url_path="historial")
    def historial(self, request, pk=None):
        """GET /api/subscriptions/{id}/historial/"""
        role      = get_request_raw_role(request)
        perfil    = get_request_profile(request)
        tenant_id = getattr(perfil, "tenant_id", None)
        _get_subscription_or_404(pk, role, tenant_id)

        history = SubscriptionHistory.objects.filter(subscription_id=pk).order_by("-created_at")
        return Response(SubscriptionHistorySerializer(history, many=True).data)

    @action(detail=True, methods=["get"], url_path="pagos")
    def pagos(self, request, pk=None):
        """GET /api/subscriptions/{id}/pagos/"""
        role      = get_request_raw_role(request)
        perfil    = get_request_profile(request)
        tenant_id = getattr(perfil, "tenant_id", None)
        _get_subscription_or_404(pk, role, tenant_id)

        attempts = PaymentAttempt.objects.filter(subscription_id=pk).order_by("-created_at")
        return Response(PaymentAttemptSerializer(attempts, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
# B-07: Admin Dashboard — todas las suscripciones (solo superadmin)
# ─────────────────────────────────────────────────────────────────────────────

class AdminSubscriptionPagination(PageNumberPagination):
    page_size             = 20
    page_size_query_param = "page_size"
    max_page_size         = 100


class AdminSubscriptionsView(APIView):
    """
    GET /api/admin/subscriptions/

    Filtros: status, plan_id, tenant_id, fecha_desde, fecha_hasta
    Ordenamiento: ?ordering=created_at,-current_period_end
    Paginación: ?page=1&page_size=20
    Seguridad: solo ROLE_SUPERADMIN
    """
    permission_classes = [IsAuthenticated, SuperAdminOnlyPermission]

    VALID_ORDERINGS = {
        "created_at", "-created_at",
        "current_period_end", "-current_period_end",
        "status", "-status",
        "updated_at", "-updated_at",
    }

    def get(self, request):
        qs = Subscription.objects.all()

        # Filtros
        s_status    = request.query_params.get("status")
        s_plan      = request.query_params.get("plan_id")
        s_tenant    = request.query_params.get("tenant_id")
        s_from      = request.query_params.get("fecha_desde")
        s_to        = request.query_params.get("fecha_hasta")
        s_cancelled = request.query_params.get("cancelled_at_period_end")

        if s_status:
            valid = {c[0] for c in Subscription.STATUS_CHOICES}
            if s_status not in valid:
                return Response(
                    {"detail": f"status inválido. Opciones: {sorted(valid)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(status=s_status)

        if s_plan:
            qs = qs.filter(plan_id=s_plan)

        if s_tenant:
            qs = qs.filter(tenant_id=s_tenant)

        if s_from:
            try:
                qs = qs.filter(created_at__date__gte=s_from)
            except Exception:
                return Response({"detail": "fecha_desde inválida (use YYYY-MM-DD)."}, status=400)

        if s_to:
            try:
                qs = qs.filter(created_at__date__lte=s_to)
            except Exception:
                return Response({"detail": "fecha_hasta inválida (use YYYY-MM-DD)."}, status=400)

        if s_cancelled is not None:
            qs = qs.filter(cancelled_at_period_end=(s_cancelled.lower() == "true"))

        # Búsqueda por tenant
        search = request.query_params.get("search")
        if search:
            qs = qs.filter(tenant_id__icontains=search)

        # Ordenamiento
        ordering = request.query_params.get("ordering", "-created_at")
        if ordering not in self.VALID_ORDERINGS:
            ordering = "-created_at"
        qs = qs.order_by(ordering)

        # Paginación
        paginator = AdminSubscriptionPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AdminSubscriptionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
# Stripe Billing
# ─────────────────────────────────────────────────────────────────────────────

def _get_stripe():
    import stripe as _stripe
    key = os.getenv("STRIPE_SECRET_KEY") or getattr(settings, "STRIPE_SECRET_KEY", "")
    if not key:
        return None
    _stripe.api_key = key
    return _stripe


class StripeCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        stripe = _get_stripe()
        if not stripe:
            return Response(
                {"detail": "Stripe no está configurado. Añade STRIPE_SECRET_KEY al .env"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        plan_id     = request.data.get("plan_id")
        cycle       = request.data.get("billing_cycle", "monthly")
        success_url = request.data.get("success_url", "http://localhost:3000/admin?subscripcion=ok")
        cancel_url  = request.data.get("cancel_url",  "http://localhost:3000/admin?subscripcion=cancelada")

        plan = Plan.objects.filter(id=plan_id, is_active=True).first()
        if not plan:
            return Response({"detail": "Plan no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        price_amount = plan.price_yearly if cycle == "yearly" else plan.price_monthly
        if not price_amount:
            return Response({"detail": "Este plan no tiene precio configurado."}, status=status.HTTP_400_BAD_REQUEST)

        perfil = get_request_profile(request)
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="subscription",
                customer_email=getattr(perfil, "email", None),
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "recurring": {"interval": "year" if cycle == "yearly" else "month"},
                        "unit_amount": int(price_amount * 100),
                        "product_data": {"name": plan.nombre},
                    },
                    "quantity": 1,
                }],
                metadata={
                    "plan_id":   str(plan_id),
                    "tenant_id": str(getattr(perfil, "tenant_id", "")),
                    "billing_cycle": cycle,
                },
                success_url=success_url,
                cancel_url=cancel_url,
            )
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"checkout_url": session.url, "session_id": session.id})


class StripeWebhookView(APIView):
    permission_classes    = [AllowAny]
    authentication_classes = []

    def post(self, request):
        stripe = _get_stripe()
        if not stripe:
            return Response(status=status.HTTP_200_OK)

        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
        payload    = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            if webhook_secret:
                event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            else:
                event = stripe.Event.construct_from(
                    stripe.util.convert_to_stripe_object(
                        stripe.util.json.loads(payload), stripe.api_key, None
                    ),
                    stripe.api_key,
                )
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        etype = event["type"]
        obj   = event["data"]["object"]

        if etype == "checkout.session.completed":
            meta      = obj.get("metadata", {})
            tenant_id = meta.get("tenant_id")
            plan_id   = meta.get("plan_id")
            cycle     = meta.get("billing_cycle", "monthly")
            if tenant_id and plan_id:
                now = timezone.now()
                end = now + timezone.timedelta(days=365 if cycle == "yearly" else 30)
                Subscription.objects.update_or_create(
                    tenant_id=tenant_id,
                    defaults=dict(
                        plan_id=plan_id,
                        status=Subscription.STATUS_ACTIVE,
                        billing_cycle=cycle,
                        current_period_start=now,
                        current_period_end=end,
                        stripe_subscription_id=obj.get("subscription"),
                        stripe_customer_id=obj.get("customer"),
                    ),
                )

        elif etype in {"customer.subscription.deleted", "customer.subscription.updated"}:
            stripe_sub_id = obj.get("id")
            if stripe_sub_id:
                status_map = {
                    "active":   Subscription.STATUS_ACTIVE,
                    "trialing": Subscription.STATUS_TRIALING,
                    "past_due": Subscription.STATUS_PAST_DUE,
                    "canceled": Subscription.STATUS_CANCELLED,
                }
                new_status = status_map.get(obj.get("status"), Subscription.STATUS_PAST_DUE)
                Subscription.objects.filter(stripe_subscription_id=stripe_sub_id).update(status=new_status)

        return Response({"received": True})


class StripeBillingPortalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        stripe = _get_stripe()
        if not stripe:
            return Response(
                {"detail": "Stripe no está configurado."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        perfil    = get_request_profile(request)
        tenant_id = getattr(perfil, "tenant_id", None)
        sub = Subscription.objects.filter(tenant_id=tenant_id).order_by("-created_at").first()
        if not sub or not sub.stripe_customer_id:
            return Response(
                {"detail": "No hay suscripción con Stripe activa."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return_url = request.data.get("return_url", "http://localhost:3000/admin")
        try:
            session = stripe.billing_portal.Session.create(
                customer=sub.stripe_customer_id, return_url=return_url
            )
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"portal_url": session.url})
