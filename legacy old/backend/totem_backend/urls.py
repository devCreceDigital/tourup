from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

admin.site.site_header = "Traventia"
admin.site.site_title = "Traventia Admin"
admin.site.index_title = "Panel de administración"


def healthcheck(_request):
    return JsonResponse({"status": "ok", "service": "totem-backend"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', healthcheck, name='healthcheck'),
    path('api/', include('apps.usuarios.urls')),
    path('api/', include('apps.tenancy.urls')),
    path('api/', include('apps.planes.urls')),
    path('api/', include('apps.catalogo.urls')),
    path('api/', include('apps.itinerarios.urls')),
    path('api/', include('apps.viajes.urls')),
    path('api/', include('apps.inscripciones.urls')),
    path('api/', include('apps.pagos.urls')),
    path('api/', include('apps.documentos.urls')),
    path('api/', include('apps.notificaciones.urls')),
    path('api/asistente-ia/', include('apps.asistente_ia.urls')),
    path('api/soporte/', include('apps.soporte.urls')),
    path('api/superadmin/', include('apps.superadmin.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
