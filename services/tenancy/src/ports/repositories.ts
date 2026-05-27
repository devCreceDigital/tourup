import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { Tenant, TenantSnapshot } from "../domain/entities.js";

export interface TenantRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<Tenant | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Tenant | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly TenantSnapshot[]>;
  save(entity: Tenant, idempotencyKey?: IdempotencyKey): Promise<void>;
}
