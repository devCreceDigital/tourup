import type { IdempotencyKey, TenantContext } from "@totem/shared-kernel";
import type { AuditEvent } from "../domain/audit-event.js";

export interface AuditRepository {
  append(event: AuditEvent, idempotencyKey?: IdempotencyKey): Promise<void>;
  listByTenant(tenantId: AuditEvent["tenantId"]): Promise<readonly AuditEvent[]>;
}

export class RecordAuditEvent {
  constructor(private readonly audit: AuditRepository) {}

  async execute(event: AuditEvent, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<AuditEvent> {
    const recorded: AuditEvent = {
      ...event,
      tenantId: event.tenantId ?? context.tenantId,
      actorUserId: event.actorUserId ?? context.userId
    };
    await this.audit.append(recorded, idempotencyKey);
    return recorded;
  }
}
