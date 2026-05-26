import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { AssistantSession, AssistantSessionSnapshot } from "../domain/entities.js";

export interface AssistantSessionRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<AssistantSession | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<AssistantSession | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly AssistantSessionSnapshot[]>;
  save(entity: AssistantSession, idempotencyKey?: IdempotencyKey): Promise<void>;
}
