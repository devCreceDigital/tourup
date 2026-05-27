import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { PlatformTenantView, PlatformTenantViewSnapshot } from "../domain/entities.js";

export interface PlatformTenantViewRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<PlatformTenantView | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<PlatformTenantView | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly PlatformTenantViewSnapshot[]>;
  save(entity: PlatformTenantView, idempotencyKey?: IdempotencyKey): Promise<void>;
}
