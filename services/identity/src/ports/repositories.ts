import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { Profile, ProfileSnapshot } from "../domain/entities.js";

export interface ProfileRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<Profile | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Profile | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly ProfileSnapshot[]>;
  save(entity: Profile, idempotencyKey?: IdempotencyKey): Promise<void>;
}
