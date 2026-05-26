from django.urls import path

from apps.usuarios.views import (
    AceptarInvitacionView,
    CambiarRolView,
    InvitacionesListView,
    InvitarUsuarioView,
    LoginView,
    PerfilMeView,
    PerfilViewSet,
    RefreshTokenView,
    TenantUsuariosListView,
    debug_auth,
)

urlpatterns = [
    path("auth/login/",  LoginView.as_view(),        name="auth-login"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path("debug-auth/",  debug_auth,                  name="debug-auth"),

    path("perfil/me/",   PerfilMeView.as_view(),      name="perfil-me"),
    path("perfiles/",    PerfilViewSet.as_view({"get": "list"}), name="perfiles-list"),
    path("perfiles/<uuid:pk>/",
         PerfilViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update"}),
         name="perfiles-detail"),
    path("perfiles/<uuid:pk>/cambiar-rol/", CambiarRolView.as_view(), name="cambiar-rol"),

    # Gestión usuarios del tenant
    path("tenant/usuarios/", TenantUsuariosListView.as_view(), name="tenant-usuarios"),

    # Invitaciones
    path("usuarios/invitar/",              InvitarUsuarioView.as_view(),   name="invitar-usuario"),
    path("usuarios/invitaciones/",         InvitacionesListView.as_view(), name="invitaciones-list"),
    path("usuarios/invitaciones/aceptar/", AceptarInvitacionView.as_view(), name="aceptar-invitacion"),
]
