import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { TripStatus } from "../domain/entities.js";

export type CreateTripCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: TripStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateTripCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeTripStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: TripStatus;
};

export type TripsCommandName =
  | "CreateTrip"
  | "UpdateTrip"
  | "PublishTrip"
  | "ArchiveTrip";
