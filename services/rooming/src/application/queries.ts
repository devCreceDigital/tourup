import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetRoomingPlanQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListRoomingPlansQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
