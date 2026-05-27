import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { CloneItinerary, PublishItinerary, SaveItinerary, type ItineraryRepository } from "../../application/itinerary-use-cases.js";
import type { Itinerary, ItineraryDay } from "../../domain/itinerary.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

function days(value: unknown): readonly ItineraryDay[] {
  return Array.isArray(value) ? (value as readonly ItineraryDay[]) : [];
}

export function createItineraryBusinessRoutes(repository: ItineraryRepository): readonly Route[] {
  const saveItinerary = new SaveItinerary(repository);
  const cloneItinerary = new CloneItinerary(repository, () => parseEntityId(randomUUID()));
  const publishItinerary = new PublishItinerary(repository);
  return [
    {
      method: "POST",
      path: "/itineraries/save",
      handler: async (request) => {
        const body = record(request.body);
        if (request.context.tenantId === null) throw new Error("Tenant context is required.");
        const itinerary: Itinerary = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId,
          name: text(body, "name"),
          description: typeof body.description === "string" ? body.description : "",
          version: typeof body.version === "number" ? body.version : 1,
          status: body.status === "activo" ? "activo" : "borrador",
          days: days(body.days)
        };
        const key = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${itinerary.name}:${randomUUID()}`);
        return saveItinerary.execute(itinerary, key, request.context);
      }
    },
    {
      method: "POST",
      path: "/itineraries/clone",
      handler: async (request) => cloneItinerary.execute(parseEntityId(text(record(request.body), "itineraryId")), request.context)
    },
    {
      method: "POST",
      path: "/itineraries/publish",
      handler: async (request) => publishItinerary.execute(parseEntityId(text(record(request.body), "itineraryId")), request.context)
    }
  ];
}
