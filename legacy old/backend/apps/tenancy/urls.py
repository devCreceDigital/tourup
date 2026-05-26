from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.tenancy.views import OnboardingView, TenantPreferenciasView, TenantViewSet
from apps.tenancy.public_views import pagina_agencia, lista_agencias, agencia_by_tenant

router = DefaultRouter()
router.register("tenants", TenantViewSet, basename="tenants")

urlpatterns = router.urls + [
    path("agencias/", lista_agencias, name="lista-agencias"),
    path("agencias/by-tenant/<uuid:tenant_id>/", agencia_by_tenant, name="agencia-by-tenant"),
    path("agencias/<str:dominio>/", pagina_agencia, name="pagina-agencia"),
    path("tenants/<uuid:tenant_id>/onboarding/", OnboardingView.as_view(), name="tenant-onboarding"),
    path("tenants/<uuid:tenant_id>/preferencias/", TenantPreferenciasView.as_view(), name="tenant-preferencias"),
]
