from django.urls import path

from apps.pagos.views import (
    CuotaDetailView,
    CuotasPorViajeListCreateView,
    PagoDetailView,
    PagoManualCreateView,
    PagosListView,
    PagosPorInscripcionListView,
    PagoUpdateEstadoView,
)

urlpatterns = [
    path(
        "inscripciones/<uuid:inscripcion_id>/pagos/",
        PagosPorInscripcionListView.as_view(),
        name="pagos-por-inscripcion",
    ),
    path(
        "inscripciones/<uuid:inscripcion_id>/pagos/manual/",
        PagoManualCreateView.as_view(),
        name="pagos-manual-create",
    ),
    path("pagos/", PagosListView.as_view(), name="pagos-list"),
    path("pagos/<uuid:pk>/", PagoDetailView.as_view(), name="pagos-detail"),
    path("pagos/<uuid:pk>/estado/", PagoUpdateEstadoView.as_view(), name="pagos-update-estado"),
    path(
        "viajes/<uuid:viaje_id>/cuotas/",
        CuotasPorViajeListCreateView.as_view(),
        name="cuotas-por-viaje",
    ),
    path("cuotas/<uuid:pk>/", CuotaDetailView.as_view(), name="cuota-detail"),
]
