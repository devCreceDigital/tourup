import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetTripQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListTripsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
