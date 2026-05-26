import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetTravelerDocumentQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListTravelerDocumentsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
