import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import type { PaymentRepository } from "../../ports/repositories.js";
import { ChangePaymentStatusUseCase, CreatePaymentUseCase, GetPaymentUseCase, ListPaymentsUseCase, UpdatePaymentUseCase } from "../../application/use-cases.js";

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

export function createRoutes(repository: PaymentRepository): readonly Route[] {
  const clock = () => new Date().toISOString();
  const createUseCase = new CreatePaymentUseCase(repository, clock);
  const updateUseCase = new UpdatePaymentUseCase(repository, clock);
  const changeStatusUseCase = new ChangePaymentStatusUseCase(repository, clock);
  const getUseCase = new GetPaymentUseCase(repository);
  const listUseCase = new ListPaymentsUseCase(repository);

  return [
    {
      method: "GET",
      path: "/payments/capability",
      handler: async () => ({ service: "payments", aggregate: "Payment", capability: "traveler payments installments reconciliation" })
    },
    {
      method: "POST",
      path: "/payments",
      handler: async (request) => {
        const body = asRecord(request.body);
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const idempotencyKey = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(randomUUID() + randomUUID());
        return createUseCase.execute({
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId,
          idempotencyKey,
          status: body.status === "published" ? "published" : "draft",
          payload: asRecord(body.payload ?? body)
        }, request.context);
      }
    },
    {
      method: "GET",
      path: "/payments",
      handler: async (request) => {
        const tenantId = request.query.get("tenantId") ?? undefined;
        return listUseCase.execute({
          tenantId: tenantId === undefined ? request.context.tenantId : parseTenantId(tenantId),
          page: Number.parseInt(request.query.get("page") ?? "1", 10),
          pageSize: Number.parseInt(request.query.get("pageSize") ?? request.query.get("page_size") ?? "20", 10)
        }, request.context);
      }
    },
    {
      method: "GET",
      path: "/payments/:id",
      handler: async (request) => {
        const tenantId = request.query.get("tenantId") ?? undefined;
        return getUseCase.execute({
          id: parseEntityId(request.params.id ?? ""),
          tenantId: tenantId === undefined ? request.context.tenantId : parseTenantId(tenantId)
        }, request.context);
      }
    },
    {
      method: "PATCH",
      path: "/payments",
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
      method: "PATCH",
      path: "/payments/:id",
      handler: async (request) => {
        const body = asRecord(request.body);
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return updateUseCase.execute({
          id: parseEntityId(request.params.id ?? ""),
          tenantId,
          payload: asRecord(body.payload ?? body)
        }, request.context);
      }
    },
    {
      method: "POST",
      path: "/payments/status",
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
      path: "/payments/get",
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
      path: "/payments/list",
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
