import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { SupportTicket, SupportTicketSnapshot } from "../domain/entities.js";

export interface SupportTicketRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<SupportTicket | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<SupportTicket | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly SupportTicketSnapshot[]>;
  save(entity: SupportTicket, idempotencyKey?: IdempotencyKey): Promise<void>;
}
