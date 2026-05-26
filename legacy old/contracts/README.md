# Contracts (OpenAPI)

Esta carpeta contiene los contratos de API (OpenAPI 3.0) para Totem HUB.

## Archivo principal

- `openapi.yaml`: contrato base para endpoints críticos del SaaS multi-tenant (tenants + auth) y convenciones transversales.

## Convenciones multi-tenant

- Header: `X-Tenant-ID` (UUID) recomendado para integraciones y entornos locales.
- Host/subdominio: el backend puede resolver tenant por host (ej: `agencia.example.com`).
- Seguridad: `Bearer` JWT en `Authorization`.

## Cómo validar (opcional)

Puedes validar el YAML con cualquier linter de OpenAPI (ej: `swagger-cli`, `redocly`, etc.).
