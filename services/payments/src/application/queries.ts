import type { EntityId, TenantId } from "@totem/shared-kernel";

export type GetPaymentQuery = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
};

export type ListPaymentsQuery = {
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
};
