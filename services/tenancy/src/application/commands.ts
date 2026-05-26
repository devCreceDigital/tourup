import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { TenantStatus } from "../domain/entities.js";

export type CreateTenantCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: TenantStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateTenantCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeTenantStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: TenantStatus;
};

export type TenancyCommandName =
  | "CreateTenant"
  | "ResolveTenant"
  | "UpdateTenantPreferences"
  | "CompleteTenantOnboarding";
