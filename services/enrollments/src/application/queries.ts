import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetEnrollmentQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListEnrollmentsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
