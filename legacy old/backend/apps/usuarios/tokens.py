from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework import exceptions


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _build_claims(*, user_id: str, email: str, tenant_id: str | None, role: str, token_type: str) -> dict:
    now = _utcnow()
    expires_at = now + (
        timedelta(minutes=settings.APP_JWT_ACCESS_MINUTES)
        if token_type == "access"
        else timedelta(days=settings.APP_JWT_REFRESH_DAYS)
    )

    return {
        "iss": settings.APP_JWT_ISSUER,
        "jti": str(uuid.uuid4()),
        "sub": str(user_id),
        "user_id": str(user_id),
        "email": email,
        "tenant_id": str(tenant_id) if tenant_id else None,
        "role": role,
        "token_type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }


def build_token_pair(*, user_id: str, email: str, tenant_id: str | None, role: str) -> dict:
    access_claims = _build_claims(
        user_id=user_id,
        email=email,
        tenant_id=tenant_id,
        role=role,
        token_type="access",
    )
    refresh_claims = _build_claims(
        user_id=user_id,
        email=email,
        tenant_id=tenant_id,
        role=role,
        token_type="refresh",
    )

    access_token = jwt.encode(access_claims, settings.APP_JWT_SECRET, algorithm="HS256")
    refresh_token = jwt.encode(refresh_claims, settings.APP_JWT_SECRET, algorithm="HS256")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "access_expires_in": settings.APP_JWT_ACCESS_MINUTES * 60,
        "refresh_expires_in": settings.APP_JWT_REFRESH_DAYS * 24 * 60 * 60,
        "token_type": "Bearer",
        "claims": access_claims,
    }


def decode_app_token(token: str, *, expected_token_type: str | None = None) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.APP_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError as exc:
        raise exceptions.AuthenticationFailed("El token ha expirado.") from exc
    except jwt.InvalidTokenError as exc:
        raise exceptions.AuthenticationFailed("Token inválido.") from exc

    if payload.get("iss") != settings.APP_JWT_ISSUER:
        raise exceptions.AuthenticationFailed("Issuer de token no válido.")

    token_type = payload.get("token_type")
    if expected_token_type and token_type != expected_token_type:
        raise exceptions.AuthenticationFailed("Tipo de token no válido.")

    return payload
