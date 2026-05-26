import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import type { RoomingPlanRepository } from "../../ports/repositories.js";
import { ChangeRoomingPlanStatusUseCase, CreateRoomingPlanUseCase, GetRoomingPlanUseCase, ListRoomingPlansUseCase, UpdateRoomingPlanUseCase } from "../../application/use-cases.js";

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

export function createRoutes(repository: RoomingPlanRepository): readonly Route[] {
  const clock = () => new Date().toISOString();
  const createUseCase = new CreateRoomingPlanUseCase(repository, clock);
  const updateUseCase = new UpdateRoomingPlanUseCase(repository, clock);
  const changeStatusUseCase = new ChangeRoomingPlanStatusUseCase(repository, clock);
  const getUseCase = new GetRoomingPlanUseCase(repository);
  const listUseCase = new ListRoomingPlansUseCase(repository);

  return [
    {
      method: "GET",
      path: "/rooming/capability",
      handler: async () => ({ service: "rooming", aggregate: "RoomingPlan", capability: "rooming plans rooms traveler assignments publish locks" })
    },
    {
      method: "POST",
      path: "/rooming",
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
      path: "/rooming",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.id !== "string") throw new Error("id is required.");
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return updateUseCase.execute({ id: parseEntityId(body.id), tenantId, payload: asRecord(body.payload ?? {}) }, request.context);
      }
    },
    {
      method: "POST",
      path: "/rooming/status",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.id !== "string" || typeof body.status !== "string") throw new Error("id and status are required.");
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return changeStatusUseCase.execute({ id: parseEntityId(body.id), tenantId, status: aggregateStatus(body.status) }, request.context);
      }
    },
    {
      method: "POST",
      path: "/rooming/get",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.id !== "string") throw new Error("id is required.");
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return getUseCase.execute({ id: parseEntityId(body.id), tenantId }, request.context);
      }
    },
    {
      method: "POST",
      path: "/rooming/list",
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
