import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { IdempotencyKey } from "@totem/shared-kernel";
import type { AuditRepository } from "../../application/audit-use-cases.js";
import type { AuditEvent } from "../../domain/audit-event.js";

function asAuditEvent(payload: unknown): AuditEvent {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Audit payload is not an object.");
  }
  return payload as AuditEvent;
}

export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(event: AuditEvent, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(event.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.auditEventRecord.upsert({
      where,
      create: {
        id: String(event.id),
        tenantId: event.tenantId === null ? null : String(event.tenantId),
        status: "recorded",
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(event)
      },
      update: {}
    });
  }

  async listByTenant(tenantId: AuditEvent["tenantId"]): Promise<readonly AuditEvent[]> {
    const records = await this.prisma.auditEventRecord.findMany({
      where: { tenantId: tenantId === null ? null : String(tenantId) },
      orderBy: { createdAt: "desc" }
    });
    return records.map((record) => asAuditEvent(record.payload));
  }
}
