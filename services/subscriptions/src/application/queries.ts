import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetSubscriptionQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListSubscriptionsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
