import type { EntityId, TenantId } from "@totem/shared-kernel";
import { RoomingPlanInvariantViolation } from "./errors.js";

export type RoomGenderPolicy = "mixto" | "masculino" | "femenino" | "sin_restriccion";
export type RoomingLifecycle = "borrador" | "bloqueado" | "publicado";

export type RoomAssignment = {
  readonly roomId: EntityId;
  readonly lodgingId: EntityId | null;
  readonly name: string;
  readonly capacity: number;
  readonly genderPolicy: RoomGenderPolicy;
  readonly travelerIds: readonly EntityId[];
};

export type RoomingRules = {
  readonly allowMixedRooms: boolean;
  readonly enforceCapacity: boolean;
  readonly requireAllTravelersAssignedBeforePublish: boolean;
};

export type RoomingPlanDetails = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly tripId: EntityId;
  readonly lifecycle: RoomingLifecycle;
  readonly rooms: readonly RoomAssignment[];
  readonly unassignedTravelerIds: readonly EntityId[];
  readonly rules: RoomingRules;
  readonly version: number;
};

function assertRoomCapacity(room: RoomAssignment, enforceCapacity: boolean): void {
  if (room.capacity < 1) throw new RoomingPlanInvariantViolation("Room capacity must be at least 1.");
  if (enforceCapacity && room.travelerIds.length > room.capacity) {
    throw new RoomingPlanInvariantViolation("Room capacity exceeded.");
  }
}

function assertNoDuplicateTravelers(plan: RoomingPlanDetails): void {
  const seen = new Set<string>();
  for (const room of plan.rooms) {
    for (const travelerId of room.travelerIds) {
      const key = String(travelerId);
      if (seen.has(key)) throw new RoomingPlanInvariantViolation("Traveler is assigned to more than one room.");
      seen.add(key);
    }
  }
  for (const travelerId of plan.unassignedTravelerIds) {
    const key = String(travelerId);
    if (seen.has(key)) throw new RoomingPlanInvariantViolation("Traveler is both assigned and unassigned.");
    seen.add(key);
  }
}

export function assertValidRoomingPlan(plan: RoomingPlanDetails): void {
  if (plan.rooms.length === 0) throw new RoomingPlanInvariantViolation("Rooming plan requires at least one room.");
  for (const room of plan.rooms) assertRoomCapacity(room, plan.rules.enforceCapacity);
  assertNoDuplicateTravelers(plan);
  if (plan.lifecycle === "publicado" && plan.rules.requireAllTravelersAssignedBeforePublish && plan.unassignedTravelerIds.length > 0) {
    throw new RoomingPlanInvariantViolation("Rooming plan cannot be published with unassigned travelers.");
  }
}

export function assignTraveler(plan: RoomingPlanDetails, travelerId: EntityId, roomId: EntityId): RoomingPlanDetails {
  if (plan.lifecycle === "publicado") throw new RoomingPlanInvariantViolation("Published rooming plan cannot be edited.");
  const rooms = plan.rooms.map((room) => ({
    ...room,
    travelerIds: room.roomId === roomId ? [...room.travelerIds, travelerId] : room.travelerIds.filter((id) => id !== travelerId)
  }));
  const updated: RoomingPlanDetails = {
    ...plan,
    rooms,
    unassignedTravelerIds: plan.unassignedTravelerIds.filter((id) => id !== travelerId),
    version: plan.version + 1
  };
  assertValidRoomingPlan(updated);
  return updated;
}

export function removeTraveler(plan: RoomingPlanDetails, travelerId: EntityId): RoomingPlanDetails {
  if (plan.lifecycle === "publicado") throw new RoomingPlanInvariantViolation("Published rooming plan cannot be edited.");
  const rooms = plan.rooms.map((room) => ({ ...room, travelerIds: room.travelerIds.filter((id) => id !== travelerId) }));
  const alreadyUnassigned = plan.unassignedTravelerIds.some((id) => id === travelerId);
  const updated: RoomingPlanDetails = {
    ...plan,
    rooms,
    unassignedTravelerIds: alreadyUnassigned ? plan.unassignedTravelerIds : [...plan.unassignedTravelerIds, travelerId],
    version: plan.version + 1
  };
  assertValidRoomingPlan(updated);
  return updated;
}
