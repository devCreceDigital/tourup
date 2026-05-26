from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.itinerarios.views import (
    DiaItinerarioDetailView,
    DiasItinerarioListCreateView,
    EventoDetailView,
    EventosListCreateView,
    ItinerarioViewSet,
)

router = DefaultRouter()
router.register("itinerarios", ItinerarioViewSet, basename="itinerarios")

urlpatterns = [
    path(
        "itinerarios/<uuid:itinerario_id>/dias/",
        DiasItinerarioListCreateView.as_view(),
        name="dias-itinerario-list",
    ),
    path(
        "itinerarios/<uuid:itinerario_id>/dias/<uuid:dia_id>/",
        DiaItinerarioDetailView.as_view(),
        name="dia-itinerario-detail",
    ),
    path(
        "itinerarios/<uuid:itinerario_id>/dias/<uuid:dia_id>/eventos/",
        EventosListCreateView.as_view(),
        name="eventos-list",
    ),
    path(
        "itinerarios/<uuid:itinerario_id>/dias/<uuid:dia_id>/eventos/<uuid:evento_id>/",
        EventoDetailView.as_view(),
        name="evento-detail",
    ),
]

urlpatterns += router.urls
