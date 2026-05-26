import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { AuditEvent, AuditEventSnapshot } from "../domain/entities.js";

export interface AuditEventRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<AuditEvent | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<AuditEvent | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly AuditEventSnapshot[]>;
  save(entity: AuditEvent, idempotencyKey?: IdempotencyKey): Promise<void>;
}
