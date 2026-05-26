import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetItineraryQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListItinerarysQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
