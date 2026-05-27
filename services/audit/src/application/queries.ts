import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetAuditEventQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListAuditEventsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
