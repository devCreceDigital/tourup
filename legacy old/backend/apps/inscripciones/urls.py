from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.inscripciones.views import (
    AdminDashboardStatsView,
    AdminInscripcionesUsuariosView,
    InscripcionAccionMasivaView,
    DatosSaludDetailUpdateView,
    InscripcionExportarView,
    InscripcionPorViajeListCreateView,
    InscripcionPublicaView,
    InscripcionResumenView,
    InscripcionViewSet,
    MisInscripcionDetailView,
    MisInscripcionesListView,
)

router = DefaultRouter()
router.register("inscripciones", InscripcionViewSet, basename="inscripciones")

urlpatterns = [
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    path('admin/inscripciones-por-usuario/', AdminInscripcionesUsuariosView.as_view(), name='admin-inscripciones-usuarios'),
    path(
        "viajes/<uuid:viaje_id>/inscripciones/",
        InscripcionPorViajeListCreateView.as_view(),
        name="inscripciones-por-viaje",
    ),
    path("mis-inscripciones/", MisInscripcionesListView.as_view(), name="mis-inscripciones"),
    path(
        "mis-inscripciones/<uuid:inscripcion_id>/",
        MisInscripcionDetailView.as_view(),
        name="mis-inscripcion-detail",
    ),
    path(
        "viajes/<uuid:viaje_id>/inscripciones/exportar/",
        InscripcionExportarView.as_view(),
        name="inscripciones-exportar",
    ),
    path(
        "viajes/<uuid:viaje_id>/inscripciones/acciones-masivas/",
        InscripcionAccionMasivaView.as_view(),
        name="inscripciones-acciones-masivas",
    ),
    path(
        "public/viajes/<slug:slug>/inscribirse/",
        InscripcionPublicaView.as_view(),
        name="inscripcion-publica",
    ),
    path(
        "inscripciones/<uuid:inscripcion_id>/salud/",
        DatosSaludDetailUpdateView.as_view(),
        name="inscripcion-salud",
    ),
    path(
        "inscripciones/<uuid:inscripcion_id>/resumen/",
        InscripcionResumenView.as_view(),
        name="inscripcion-resumen",
    ),
]

urlpatterns += router.urls
