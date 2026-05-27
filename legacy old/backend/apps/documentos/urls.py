from django.urls import path

from apps.documentos.views import (
    DocumentoAprobarView,
    DocumentoDetailView,
    DocumentoRechazarView,
    DocumentosPorInscripcionListCreateView,
)

urlpatterns = [
    path(
        "inscripciones/<uuid:inscripcion_id>/documentos/",
        DocumentosPorInscripcionListCreateView.as_view(),
        name="documentos-por-inscripcion",
    ),
    path("documentos/<uuid:pk>/", DocumentoDetailView.as_view(), name="documentos-detail"),
    path(
        "documentos/<uuid:pk>/aprobar/",
        DocumentoAprobarView.as_view(),
        name="documentos-aprobar",
    ),
    path(
        "documentos/<uuid:pk>/rechazar/",
        DocumentoRechazarView.as_view(),
        name="documentos-rechazar",
    ),
]
