from rest_framework.routers import DefaultRouter

from apps.catalogo.views import (
    ActividadViewSet,
    AlojamientoViewSet,
    ComplementoViewSet,
    DestinoViewSet,
)

router = DefaultRouter()
router.register("destinos", DestinoViewSet, basename="destinos")
router.register("actividades", ActividadViewSet, basename="actividades")
router.register("alojamientos", AlojamientoViewSet, basename="alojamientos")
router.register("complementos", ComplementoViewSet, basename="complementos")

urlpatterns = router.urls
