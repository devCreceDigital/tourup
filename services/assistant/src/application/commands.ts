import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { AssistantSessionStatus } from "../domain/entities.js";

export type CreateAssistantSessionCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: AssistantSessionStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateAssistantSessionCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeAssistantSessionStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: AssistantSessionStatus;
};

export type AssistantCommandName =
  | "CreateAssistantSession"
  | "SendAssistantMessage"
  | "CreateAssistantLead"
  | "SaveTripPlan";
