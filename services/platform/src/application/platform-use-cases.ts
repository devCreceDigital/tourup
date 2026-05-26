import type { EntityId, TenantContext } from "@totem/shared-kernel";

export interface PlatformRepository {
  getMetrics(): Promise<import("../domain/platform.js").PlatformMetrics>;
  listTenants(): Promise<readonly import("../domain/platform.js").PlatformTenantSummary[]>;
  changeTenantStatus(tenantId: EntityId, status: "activo" | "cancelado" | "suspendido"): Promise<void>;
}

function assertSuperadmin(context: TenantContext): void {
  if (context.role !== "superadmin") {
    throw new Error("Superadmin role is required.");
  }
}

export class GetPlatformMetrics {
  constructor(private readonly platform: PlatformRepository) {}

  async execute(context: TenantContext) {
    assertSuperadmin(context);
    return this.platform.getMetrics();
  }
}

export class SuspendTenant {
  constructor(private readonly platform: PlatformRepository) {}

  async execute(tenantId: EntityId, context: TenantContext): Promise<void> {
    assertSuperadmin(context);
    await this.platform.changeTenantStatus(tenantId, "suspendido");
  }
}
