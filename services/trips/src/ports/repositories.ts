import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { Trip, TripSnapshot } from "../domain/entities.js";

export interface TripRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<Trip | null>;
  findPublicBySlug(slug: string): Promise<Trip | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Trip | null>;
  listPublic(page: number, pageSize: number): Promise<readonly TripSnapshot[]>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly TripSnapshot[]>;
  save(entity: Trip, idempotencyKey?: IdempotencyKey): Promise<void>;
}
