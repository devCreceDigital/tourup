from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.viajes.views import (
    OperacionesListView,
    PublicViajeDetailView,
    PublicViajesListView,
    ViajeOperacionDetailView,
    ViajeOperacionesView,
    ViajeViewSet,
)

router = DefaultRouter()
router.register("viajes", ViajeViewSet, basename="viajes")

urlpatterns = [
    # Endpoints públicos (sin autenticación)
    path("public/viajes/", PublicViajesListView.as_view(), name="public-viajes-list"),
    path("public/viajes/<slug:slug>/", PublicViajeDetailView.as_view(), name="public-viajes-detail"),
    # Endpoints admin
    path("viajes/<uuid:pk>/publicar/", ViajeViewSet.as_view({"post": "publicar"}), name="viajes-publicar"),
    path("operaciones/", OperacionesListView.as_view(), name="operaciones-list"),
    path("viajes/<uuid:viaje_id>/operaciones/", ViajeOperacionesView.as_view(), name="viaje-operaciones"),
    path(
        "viajes/<uuid:viaje_id>/operaciones/<slug:operacion_id>/",
        ViajeOperacionDetailView.as_view(),
        name="viaje-operacion-detail",
    ),
]

urlpatterns += router.urls
