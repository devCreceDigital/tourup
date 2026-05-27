from __future__ import annotations

import json
from urllib import error, request

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from rest_framework import exceptions

from apps.usuarios.models import Perfil


def authenticate_with_supabase(email: str, password: str) -> dict:
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ImproperlyConfigured(
            "SUPABASE_URL y SUPABASE_ANON_KEY son obligatorias para /api/auth/login."
        )

    endpoint = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password"
    payload = json.dumps({"email": email, "password": password}).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "apikey": settings.SUPABASE_ANON_KEY,
    }

    req = request.Request(endpoint, data=payload, headers=headers, method="POST")

    try:
        with request.urlopen(req, timeout=15) as response:
            body = response.read().decode("utf-8")
    except error.HTTPError as exc:
        if exc.code in {400, 401}:
            raise exceptions.AuthenticationFailed("Credenciales incorrectas.") from exc
        raise exceptions.AuthenticationFailed("No se pudo autenticar contra Supabase.") from exc
    except error.URLError as exc:
        raise exceptions.AuthenticationFailed("No se pudo conectar con Supabase Auth.") from exc

    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        raise exceptions.AuthenticationFailed("Respuesta inválida desde Supabase Auth.") from exc

    user = data.get("user") or {}
    if not user.get("id") or not user.get("email"):
        raise exceptions.AuthenticationFailed("Supabase Auth no devolvió datos de usuario válidos.")

    return data


def get_profile_for_login(email: str, auth_user: dict | None = None):
    perfil = Perfil.objects.filter(email=email).first()
    if not perfil and auth_user:
        # Robustez: si el perfil no existe pero la auth fue exitosa, lo creamos
        from django.utils import timezone
        perfil = Perfil.objects.create(
            id=auth_user.get("id"),
            email=email,
            nombre=auth_user.get("user_metadata", {}).get("full_name", ""),
            rol=auth_user.get("user_metadata", {}).get("rol", "usuario"),
            created_at=timezone.now()
        )
    if not perfil:
        raise exceptions.AuthenticationFailed("No existe un perfil asociado al usuario autenticado.")
    return perfil
