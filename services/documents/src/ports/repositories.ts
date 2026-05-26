import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { TravelerDocument, TravelerDocumentSnapshot } from "../domain/entities.js";

export interface TravelerDocumentRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<TravelerDocument | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<TravelerDocument | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly TravelerDocumentSnapshot[]>;
  save(entity: TravelerDocument, idempotencyKey?: IdempotencyKey): Promise<void>;
}
