import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetNotificationQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListNotificationsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
