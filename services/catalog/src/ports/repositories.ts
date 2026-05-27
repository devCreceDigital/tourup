import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { CatalogItem, CatalogItemSnapshot } from "../domain/entities.js";

export interface CatalogItemRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<CatalogItem | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<CatalogItem | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly CatalogItemSnapshot[]>;
  save(entity: CatalogItem, idempotencyKey?: IdempotencyKey): Promise<void>;
}
