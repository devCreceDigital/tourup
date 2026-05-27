import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { EntityId } from "@totem/shared-kernel";
import type { PlatformRepository } from "../../application/platform-use-cases.js";
import type { PlatformMetrics, PlatformTenantSummary } from "../../domain/platform.js";

function asTenantSummary(payload: unknown): PlatformTenantSummary {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new Error("Platform tenant payload is not an object.");
  return payload as PlatformTenantSummary;
}

export class PrismaPlatformRepository implements PlatformRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getMetrics(): Promise<PlatformMetrics> {
    const records = await this.prisma.platformTenantViewRecord.findMany({ take: 1000 });
    const tenants = records.map((record) => asTenantSummary(record.payload));
    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter((tenant) => tenant.status === "activo").length,
      suspendedTenants: tenants.filter((tenant) => tenant.status === "suspendido").length,
      openTickets: 0
    };
  }

  async listTenants(): Promise<readonly PlatformTenantSummary[]> {
    const records = await this.prisma.platformTenantViewRecord.findMany({ orderBy: { createdAt: "desc" } });
    return records.map((record) => asTenantSummary(record.payload));
  }

  async changeTenantStatus(tenantId: EntityId, status: "activo" | "cancelado" | "suspendido"): Promise<void> {
    const record = await this.prisma.platformTenantViewRecord.findFirst({ where: { id: String(tenantId) } });
    if (record === null) throw new Error("Tenant view not found.");
    const tenant = asTenantSummary(record.payload);
    await this.prisma.platformTenantViewRecord.update({
      where: { id: String(tenantId) },
      data: { status, payload: toJsonObject({ ...tenant, status }) }
    });
  }
}
