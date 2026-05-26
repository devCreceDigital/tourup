# Multitenant security contract

Totem HUB treats `tenantId` and `businessId` as the same tenant boundary unless a future bounded context introduces a separate business aggregate.

## Request identity

- Browser/client headers `x-tenant-id`, `x-user-id`, `x-user-email`, `x-user-role` and `x-business-id` are not trusted.
- The API gateway verifies the bearer JWT and resolves the effective profile from Identity when possible.
- The gateway forwards only internal identity headers:
  - `x-internal-service-secret`
  - `x-internal-tenant-id`
  - `x-internal-business-id`
  - `x-internal-user-id`
  - `x-internal-user-email`
  - `x-internal-user-role`
  - `x-internal-public-path`
- Services ignore internal identity headers unless `x-internal-service-secret` matches `SERVICE_INTERNAL_SECRET`.

## Tenant scope

All generic application use cases resolve requested tenant ids through `tenantScope(context, requestedTenantId)`.

- `superadmin` may request any tenant or `null` for platform/global reads.
- `admin`, `viajero`, `system` and `anonymous` cannot override their context tenant.
- A requested tenant different from the authenticated context tenant fails with `Tenant scope mismatch.`
- Protected routes with no trusted tenant fail with `Tenant context is required.`

## Public flows

Public endpoints are explicitly marked by the gateway and services receive `context.isPublic = true`.
Only public routes may accept tenant ids from request bodies, for example public enrollment or assistant leads.

## Required environment

`SERVICE_INTERNAL_SECRET` is required for Docker Compose. Use a long random value and keep it out of client-visible variables.

JWT verification uses the first-party Identity service token signed with `APP_JWT_SECRET`.

Optional:

- `APP_JWT_ISSUER` when issuer enforcement is required.

## Database RLS

Postgres RLS policies exist in `infra/postgres/init/002-rls-foundation.sql`. The script installs `platform_security.apply_tenant_rls()` and an event trigger so future tables with `tenant_id` receive RLS automatically.
Application-level enforcement is still the first active boundary because Prisma requests are isolated in code with `tenantScope`.
If future code introduces direct SQL bypassing repositories, it must set `app.tenant_id` and `app.user_role` locally in the same transaction before touching tenant tables.

## Local assistant memory

The `assistant` bounded context runs against local Ollama by default instead of an external completion provider.

Required runtime variables:

- `OLLAMA_BASE_URL`, default `http://localhost:11434` outside Docker and `http://ollama:11434` in Docker Compose.
- `OLLAMA_KEEP_ALIVE`, default `10m`, keeps loaded models warm between chat turns.
- `ASSISTANT_MODEL`, default `gemma3:4b`, used only for final answer composition.
- `ASSISTANT_MAX_TOKENS`, default `360`, caps local answer generation for interactive latency.
- `ASSISTANT_CLASSIFIER_MODE`, default `heuristic`, uses local deterministic intent extraction without an LLM call. Set to `ollama` only when classifier quality matters more than latency.
- `ASSISTANT_CLASSIFIER_MODEL`, default same as `ASSISTANT_MODEL`, used only when `ASSISTANT_CLASSIFIER_MODE=ollama`.
- `ASSISTANT_EMBEDDING_MODEL`, default `embeddinggemma`, used only for memory/search embeddings.

Docker Compose includes an `ollama` service with a persistent `ollama_data` volume. To pre-pull local models, run `docker compose --profile models up ollama-models`.

Assistant sessions persist `tenantId`, `businessId`, `userId`, and `userEmail` from trusted internal headers.
The service classifies user messages, stores durable facts/preferences in `assistant.assistant_memories`, and retrieves only memories matching the active tenant plus tenant-level or current-user scope.

Admin-facing endpoints:

- `GET /assistant/tenant-dashboard` returns tenant-scoped assistant totals and recent memory.
- `GET /assistant/memory` lists tenant/user memory visible to the current principal.
- `GET /assistant/stats` is tenant-aware when called through the gateway.

Public assistant flows may create anonymous sessions, but tenant-specific memory is only persisted when a trusted tenant context exists.
