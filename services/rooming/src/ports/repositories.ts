import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { RoomingPlan, RoomingPlanSnapshot } from "../domain/entities.js";

export interface RoomingPlanRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<RoomingPlan | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<RoomingPlan | null>;
  save(entity: RoomingPlan, idempotencyKey?: IdempotencyKey): Promise<void>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly RoomingPlanSnapshot[]>;
}
