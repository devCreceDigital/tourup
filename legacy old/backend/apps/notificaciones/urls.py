from django.urls import path

from apps.notificaciones.views import NotificacionesListView, NotificacionesMarcarView

urlpatterns = [
    path("notificaciones/", NotificacionesListView.as_view(), name="notificaciones-list"),
    path("notificaciones/marcar/", NotificacionesMarcarView.as_view(), name="notificaciones-marcar"),
]
