import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetAssistantSessionQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListAssistantSessionsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
