import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import type { TripRepository } from "../../ports/repositories.js";
import { ChangeTripStatusUseCase, CreateTripUseCase, GetTripUseCase, ListTripsUseCase, UpdateTripUseCase } from "../../application/use-cases.js";
import type { TripSnapshot } from "../../domain/entities.js";

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

function tripStatusFromBody(body: Record<string, unknown>) {
  if (typeof body.status === "string") {
    return aggregateStatus(body.status);
  }
  if (body.estado === "publicado") return "published";
  if (body.estado === "archivado") return "archived";
  if (body.estado === "cancelado") return "cancelled";
  return "draft";
}

function presentTrip(snapshot: TripSnapshot): Record<string, unknown> {
  return {
    ...snapshot.payload,
    id: String(snapshot.id),
    tenantId: snapshot.tenantId === null ? null : String(snapshot.tenantId),
    status: snapshot.status,
    version: snapshot.version,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt
  };
}

export function createRoutes(repository: TripRepository): readonly Route[] {
  const clock = () => new Date().toISOString();
  const createUseCase = new CreateTripUseCase(repository, clock);
  const updateUseCase = new UpdateTripUseCase(repository, clock);
  const changeStatusUseCase = new ChangeTripStatusUseCase(repository, clock);
  const getUseCase = new GetTripUseCase(repository);
  const listUseCase = new ListTripsUseCase(repository);

  return [
    {
      method: "GET",
      path: "/trips/capability",
      handler: async () => ({ service: "trips", aggregate: "Trip", capability: "trips landings operations public catalogue" })
    },
    {
      method: "POST",
      path: "/trips",
      handler: async (request) => {
        const body = asRecord(request.body);
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const idempotencyKey = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(randomUUID() + randomUUID());
        const created = await createUseCase.execute({
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId,
          idempotencyKey,
          status: tripStatusFromBody(body),
          payload: asRecord(body.payload ?? body)
        }, request.context);
        return presentTrip(created);
      }
    },
    {
      method: "GET",
      path: "/trips",
      handler: async (request) => {
        const tenantId = request.query.get("tenantId") ?? undefined;
        const trips = await listUseCase.execute({
          tenantId: tenantId === undefined ? request.context.tenantId : parseTenantId(tenantId),
          page: Number.parseInt(request.query.get("page") ?? "1", 10),
          pageSize: Number.parseInt(request.query.get("pageSize") ?? request.query.get("page_size") ?? "20", 10)
        }, { ...request.context, isPublic: request.context.tenantId === null && tenantId === undefined });
        return trips.map(presentTrip);
      }
    },
    {
      method: "GET",
      path: "/trips/public/:slug",
      handler: async (request) => {
        const slug = request.params.slug ?? "";
        if (slug.trim().length === 0) throw new Error("slug is required.");
        const trip = await repository.findPublicBySlug(slug.trim());
        if (trip === null) throw new Error("Trip not found.");
        return presentTrip(trip.toSnapshot());
      }
    },
    {
      method: "GET",
      path: "/trips/:id",
      handler: async (request) => {
        const tenantId = request.query.get("tenantId") ?? undefined;
        const trip = await getUseCase.execute({
          id: parseEntityId(request.params.id ?? ""),
          tenantId: tenantId === undefined ? request.context.tenantId : parseTenantId(tenantId)
        }, request.context);
        return presentTrip(trip);
      }
    },
    {
      method: "PATCH",
      path: "/trips",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.id !== "string") {
          throw new Error("id is required.");
        }
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const updated = await updateUseCase.execute({
          id: parseEntityId(body.id),
          tenantId,
          payload: asRecord(body.payload ?? {})
        }, request.context);
        return presentTrip(updated);
      }
    },
    {
      method: "PATCH",
      path: "/trips/:id",
      handler: async (request) => {
        const body = asRecord(request.body);
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const updated = await updateUseCase.execute({
          id: parseEntityId(request.params.id ?? ""),
          tenantId,
          payload: asRecord(body.payload ?? body)
        }, request.context);
        return presentTrip(updated);
      }
    },
    {
      method: "POST",
      path: "/trips/status",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.id !== "string" || typeof body.status !== "string") {
          throw new Error("id and status are required.");
        }
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const updated = await changeStatusUseCase.execute({
          id: parseEntityId(body.id),
          tenantId,
          status: aggregateStatus(body.status)
        }, request.context);
        return presentTrip(updated);
      }
    },
    {
      method: "POST",
      path: "/trips/:id/status",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.status !== "string") {
          throw new Error("status is required.");
        }
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const updated = await changeStatusUseCase.execute({
          id: parseEntityId(request.params.id ?? ""),
          tenantId,
          status: aggregateStatus(body.status)
        }, request.context);
        return presentTrip(updated);
      }
    },
    {
      method: "POST",
      path: "/trips/get",
      handler: async (request) => {
        const body = asRecord(request.body);
        if (typeof body.id !== "string") {
          throw new Error("id is required.");
        }
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const trip = await getUseCase.execute({ id: parseEntityId(body.id), tenantId }, request.context);
        return presentTrip(trip);
      }
    },
    {
      method: "POST",
      path: "/trips/list",
      handler: async (request) => {
        const body = asRecord(request.body ?? {});
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const trips = await listUseCase.execute({
          tenantId,
          page: typeof body.page === "number" ? body.page : 1,
          pageSize: typeof body.pageSize === "number" ? body.pageSize : 20
        }, request.context);
        return trips.map(presentTrip);
      }
    }
  ];
}
