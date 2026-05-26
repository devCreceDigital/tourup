import { randomUUID } from "node:crypto";
import { createMoney, parseEntityId, parseIdempotencyKey, requireTenant } from "@totem/shared-kernel";
import { assertPlanLimit, type Route } from "@totem/service-runtime";
import { CreateTrip, PublishTrip, type TripCatalogRepository } from "../../application/trip-use-cases.js";
import type { TripCommercialConfiguration, TripDateRange, TripPublicIdentity } from "../../domain/trip.js";

function bodyAsRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function stringField(body: Record<string, unknown>, name: string): string {
  const value = body[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

export function createTripBusinessRoutes(repository: TripCatalogRepository): readonly Route[] {
  const createTrip = new CreateTrip(repository);
  const publishTrip = new PublishTrip(repository);

  return [
    {
      method: "POST",
      path: "/trips/create",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        const tenantId = requireTenant(request.context);
        if (repository.countByTenant !== undefined) {
          await assertPlanLimit({ tenantId, resource: "trips", currentCount: await repository.countByTenant(tenantId) });
        }
        const dates: TripDateRange = {
          startDate: stringField(body, "startDate"),
          endDate: stringField(body, "endDate")
        };
        const publicIdentity: TripPublicIdentity = {
          code: stringField(body, "code"),
          slug: stringField(body, "slug"),
          name: stringField(body, "name")
        };
        const commercial: TripCommercialConfiguration = {
          basePrice: typeof body.basePrice === "string" ? createMoney(body.basePrice) : null,
          currency: body.currency === "USD" ? "USD" : "PEN",
          settings: bodyAsRecord(body.settings ?? {})
        };
        return createTrip.execute(
          {
            id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
            idempotencyKey:
              typeof body.idempotencyKey === "string"
                ? parseIdempotencyKey(body.idempotencyKey)
                : parseIdempotencyKey(`${randomUUID()}${randomUUID()}`),
            itineraryId: typeof body.itineraryId === "string" ? parseEntityId(body.itineraryId) : null,
            publicIdentity,
            dates,
            capacity: { maxSeats: typeof body.maxSeats === "number" ? body.maxSeats : null },
            commercial
          },
          request.context
        );
      }
    },
    {
      method: "POST",
      path: "/trips/publish",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        return publishTrip.execute(parseEntityId(stringField(body, "tripId")), request.context);
      }
    }
  ];
}
