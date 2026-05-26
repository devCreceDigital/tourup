import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { Itinerary, ItinerarySnapshot } from "../domain/entities.js";

export interface ItineraryRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<Itinerary | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Itinerary | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly ItinerarySnapshot[]>;
  save(entity: Itinerary, idempotencyKey?: IdempotencyKey): Promise<void>;
}
