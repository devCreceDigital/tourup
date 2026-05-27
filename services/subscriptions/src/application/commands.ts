import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { SubscriptionStatus } from "../domain/entities.js";

export type CreateSubscriptionCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: SubscriptionStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateSubscriptionCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeSubscriptionStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: SubscriptionStatus;
};

export type SubscriptionsCommandName =
  | "CreatePlan"
  | "SubscribeTenant"
  | "ChangePlan"
  | "ProcessSubscriptionWebhook";
