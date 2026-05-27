import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetSupportTicketQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListSupportTicketsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
