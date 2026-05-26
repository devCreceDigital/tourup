import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { RoomingPlanStatus } from "../domain/entities.js";

export type CreateRoomingPlanCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: RoomingPlanStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateRoomingPlanCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeRoomingPlanStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: RoomingPlanStatus;
};

export type RoomingPlanCommandName =
  | "CreateRoomingPlan"
  | "UpdateRoomingPlan"
  | "PublishRoomingPlan"
  | "ArchiveRoomingPlan";
