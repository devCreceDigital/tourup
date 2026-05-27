import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetProfileQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListProfilesQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
