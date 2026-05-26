from django.urls import path
from . import views

urlpatterns = [
    path("stats/",                        views.stats_view,    name="superadmin-stats"),
    path("tenants/",                      views.tenants_list,  name="superadmin-tenants"),
    path("tenants/<uuid:tenant_id>/",     views.tenant_detail, name="superadmin-tenant-detail"),
    path("usuarios/",                     views.usuarios_list, name="superadmin-usuarios"),
]
