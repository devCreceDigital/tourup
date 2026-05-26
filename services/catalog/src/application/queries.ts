import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetCatalogItemQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListCatalogItemsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
