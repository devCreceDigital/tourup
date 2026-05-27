import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { AssignTravelerToRoom, CreateTripRoomingPlan, PublishRoomingPlan, RemoveTravelerFromRoom, type RoomingRepository } from "../../application/rooming-use-cases.js";
import type { RoomAssignment, RoomGenderPolicy, RoomingPlanDetails, RoomingRules } from "../../domain/rooming-plan.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

function genderPolicy(value: unknown): RoomGenderPolicy {
  if (value === "mixto" || value === "masculino" || value === "femenino" || value === "sin_restriccion") return value;
  return "sin_restriccion";
}

function entityList(value: unknown): readonly ReturnType<typeof parseEntityId>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string").map((entry) => parseEntityId(entry));
}

function rules(value: unknown): RoomingRules {
  const body = record(value ?? {});
  return {
    allowMixedRooms: body.allowMixedRooms !== false,
    enforceCapacity: body.enforceCapacity !== false,
    requireAllTravelersAssignedBeforePublish: body.requireAllTravelersAssignedBeforePublish === true
  };
}

function rooms(value: unknown): readonly RoomAssignment[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const body = record(entry);
    return {
      roomId: typeof body.roomId === "string" ? parseEntityId(body.roomId) : parseEntityId(randomUUID()),
      lodgingId: typeof body.lodgingId === "string" ? parseEntityId(body.lodgingId) : null,
      name: typeof body.name === "string" && body.name.trim().length > 0 ? body.name.trim() : "Habitacion",
      capacity: typeof body.capacity === "number" && Number.isInteger(body.capacity) ? body.capacity : 1,
      genderPolicy: genderPolicy(body.genderPolicy),
      travelerIds: entityList(body.travelerIds)
    };
  });
}

export function createRoomingBusinessRoutes(repository: RoomingRepository): readonly Route[] {
  const createPlan = new CreateTripRoomingPlan(repository);
  const assignTraveler = new AssignTravelerToRoom(repository);
  const removeTraveler = new RemoveTravelerFromRoom(repository);
  const publishPlan = new PublishRoomingPlan(repository);

  return [
    {
      method: "POST",
      path: "/rooming/trip-plan",
      handler: async (request) => {
        const body = record(request.body);
        const plan: RoomingPlanDetails = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(text(body, "tenantId")),
          tripId: parseEntityId(text(body, "tripId")),
          lifecycle: "borrador",
          rooms: rooms(body.rooms),
          unassignedTravelerIds: entityList(body.unassignedTravelerIds),
          rules: rules(body.rules),
          version: 1
        };
        const idempotencyKey =
          typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${plan.tenantId}:${plan.tripId}:rooming-plan`);
        return createPlan.execute(plan, idempotencyKey, request.context);
      }
    },
    {
      method: "POST",
      path: "/rooming/assign",
      handler: async (request) => {
        const body = record(request.body);
        return assignTraveler.execute(
          { planId: parseEntityId(text(body, "planId")), travelerId: parseEntityId(text(body, "travelerId")), roomId: parseEntityId(text(body, "roomId")) },
          request.context
        );
      }
    },
    {
      method: "POST",
      path: "/rooming/remove",
      handler: async (request) => {
        const body = record(request.body);
        return removeTraveler.execute({ planId: parseEntityId(text(body, "planId")), travelerId: parseEntityId(text(body, "travelerId")) }, request.context);
      }
    },
    {
      method: "POST",
      path: "/rooming/publish",
      handler: async (request) => publishPlan.execute(parseEntityId(text(record(request.body), "planId")), request.context)
    }
  ];
}
