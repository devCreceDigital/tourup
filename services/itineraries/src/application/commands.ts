import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { ItineraryStatus } from "../domain/entities.js";

export type CreateItineraryCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: ItineraryStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateItineraryCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeItineraryStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: ItineraryStatus;
};

export type ItinerariesCommandName =
  | "CreateItinerary"
  | "UpdateItinerary"
  | "CloneItinerary"
  | "PublishItinerary";
