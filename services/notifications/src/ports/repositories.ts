import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { Notification, NotificationSnapshot } from "../domain/entities.js";

export interface NotificationRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<Notification | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Notification | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly NotificationSnapshot[]>;
  save(entity: Notification, idempotencyKey?: IdempotencyKey): Promise<void>;
}
