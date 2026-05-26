from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.planes.views import (
    AdminSubscriptionsView,
    PlanViewSet,
    StripeBillingPortalView,
    StripeCheckoutView,
    StripeWebhookView,
    SubscriptionViewSet,
)

router = DefaultRouter()
router.register("plans",         PlanViewSet,         basename="plans")
router.register("subscriptions", SubscriptionViewSet, basename="subscriptions")

urlpatterns = router.urls + [
    # B-07: Admin dashboard (solo superadmin)
    path("admin/subscriptions/", AdminSubscriptionsView.as_view(), name="admin-subscriptions"),

    # Stripe
    path("billing/checkout/", StripeCheckoutView.as_view(),      name="stripe-checkout"),
    path("billing/webhook/",  StripeWebhookView.as_view(),       name="stripe-webhook"),
    path("billing/portal/",   StripeBillingPortalView.as_view(), name="stripe-portal"),
]
