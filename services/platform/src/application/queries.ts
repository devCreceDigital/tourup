import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetPlatformTenantViewQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListPlatformTenantViewsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
