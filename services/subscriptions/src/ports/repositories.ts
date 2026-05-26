import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { Subscription, SubscriptionSnapshot } from "../domain/entities.js";

export interface SubscriptionRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<Subscription | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Subscription | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly SubscriptionSnapshot[]>;
  save(entity: Subscription, idempotencyKey?: IdempotencyKey): Promise<void>;
}
