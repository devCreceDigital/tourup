import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import type { PlatformTenantViewRepository } from "../../ports/repositories.js";
import { ChangePlatformTenantViewStatusUseCase, CreatePlatformTenantViewUseCase, GetPlatformTenantViewUseCase, ListPlatformTenantViewsUseCase, UpdatePlatformTenantViewUseCase } from "../../application/use-cases.js";

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function aggregateStatus(value: string) {
  if (value === "draft" || value === "active" || value === "published" || value === "archived" || value === "cancelled" || value === "completed") {
    return value;
  }
  throw new Error("Invalid aggregate status.");
}

export function createRoutes(repository: PlatformTenantViewRepository): readonly Route[] {
  const clock = () => new Date().toISOString();
  const createUseCase = new CreatePlatformTenantViewUseCase(repository, clock);
  const updateUseCase = new UpdatePlatformTenantViewUseCase(repository, clock);
  const changeStatusUseCase = new ChangePlatformTenantViewStatusUseCase(repository, clock);
  const getUseCase = new GetPlatformTenantViewUseCase(repository);
  const listUseCase = new ListPlatformTenantViewsUseCase(repository);

  return [
    {
      method: "GET",
      path: "/platform/capability",
      handler: async () => ({ service: "platform", aggregate: "PlatformTenantView", capability: "superadmin platform metrics tenant governance" })
    },
    {
      method: "POST",
      path: "/platform",
      handler: async (request) => {
        const body = asRecord(request.body);
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const idempotencyKey = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(randomUUID() + randomUUID());
        return createUseCase.execute({
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId,
          idempotencyKey,
          status: body.status === "published" ? "published" : "draft",
          payload: asRecord(body.payload ?? {})
        }, request.context);
      }
    },
    {
      method: "PATCH",
      path: "/platform",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.id !== "string") {
          throw new Error("id is required.");
        }
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return updateUseCase.execute({
          id: parseEntityId(body.id),
          tenantId,
          payload: asRecord(body.payload ?? {})
        }, request.context);
      }
    },
    {
      method: "POST",
      path: "/platform/status",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.id !== "string" || typeof body.status !== "string") {
          throw new Error("id and status are required.");
        }
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return changeStatusUseCase.execute({
          id: parseEntityId(body.id),
          tenantId,
          status: aggregateStatus(body.status)
        }, request.context);
      }
    },
    {
      method: "POST",
      path: "/platform/get",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.id !== "string") {
          throw new Error("id is required.");
        }
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return getUseCase.execute({ id: parseEntityId(body.id), tenantId }, request.context);
      }
    },
    {
      method: "POST",
      path: "/platform/list",
      handler: async (request) => {
        const body = asRecord(request.body ?? {});
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return listUseCase.execute({
          tenantId,
          page: typeof body.page === "number" ? body.page : 1,
          pageSize: typeof body.pageSize === "number" ? body.pageSize : 20
        }, request.context);
      }
    }
  ];
}
