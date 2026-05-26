import type { EntityId } from "@totem/shared-kernel";

export type PlatformTenantSummary = {
  readonly tenantId: EntityId;
  readonly name: string;
  readonly domain: string;
  readonly status: "activo" | "cancelado" | "suspendido";
  readonly totalTrips: number;
  readonly totalUsers: number;
  readonly totalEnrollments: number;
};

export type PlatformMetrics = {
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly suspendedTenants: number;
  readonly openTickets: number;
};
