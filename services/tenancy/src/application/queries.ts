import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetTenantQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListTenantsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
