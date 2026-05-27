import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { EnrollmentStatus } from "../domain/entities.js";

export type CreateEnrollmentCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: EnrollmentStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateEnrollmentCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeEnrollmentStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: EnrollmentStatus;
};

export type EnrollmentsCommandName =
  | "CreatePublicEnrollment"
  | "CreateManualEnrollment"
  | "ConfirmEnrollment"
  | "CancelEnrollment";
