import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { Enrollment, EnrollmentSnapshot } from "../domain/entities.js";

export interface EnrollmentRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<Enrollment | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Enrollment | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly EnrollmentSnapshot[]>;
  save(entity: Enrollment, idempotencyKey?: IdempotencyKey): Promise<void>;
}
