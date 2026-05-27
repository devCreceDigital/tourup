import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { PlatformTenantViewStatus } from "../domain/entities.js";

export type CreatePlatformTenantViewCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: PlatformTenantViewStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdatePlatformTenantViewCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangePlatformTenantViewStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: PlatformTenantViewStatus;
};

export type PlatformCommandName =
  | "ListPlatformTenants"
  | "SuspendTenant"
  | "ReactivateTenant"
  | "GetPlatformMetrics";
