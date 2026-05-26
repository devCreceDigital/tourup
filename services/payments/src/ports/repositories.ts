import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { Payment, PaymentSnapshot } from "../domain/entities.js";

export interface PaymentRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<Payment | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Payment | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly PaymentSnapshot[]>;
  save(entity: Payment, idempotencyKey?: IdempotencyKey): Promise<void>;
}
