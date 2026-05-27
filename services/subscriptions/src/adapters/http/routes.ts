import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import type { SubscriptionRepository } from "../../ports/repositories.js";
import { ChangeSubscriptionStatusUseCase, CreateSubscriptionUseCase, GetSubscriptionUseCase, ListSubscriptionsUseCase, UpdateSubscriptionUseCase } from "../../application/use-cases.js";

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

export function createRoutes(repository: SubscriptionRepository): readonly Route[] {
  const clock = () => new Date().toISOString();
  const createUseCase = new CreateSubscriptionUseCase(repository, clock);
  const updateUseCase = new UpdateSubscriptionUseCase(repository, clock);
  const changeStatusUseCase = new ChangeSubscriptionStatusUseCase(repository, clock);
  const getUseCase = new GetSubscriptionUseCase(repository);
  const listUseCase = new ListSubscriptionsUseCase(repository);

  return [
    {
      method: "GET",
      path: "/subscriptions/capability",
      handler: async () => ({ service: "subscriptions", aggregate: "Subscription", capability: "saas plans tenant subscriptions provider billing" })
    },
    {
      method: "POST",
      path: "/subscriptions",
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
      path: "/subscriptions",
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
      path: "/subscriptions/status",
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
      path: "/subscriptions/get",
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
      path: "/subscriptions/list",
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
