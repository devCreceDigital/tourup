import type { EntityId, TenantId, UserId } from "@totem/shared-kernel";

export type EnrollmentStatus = "pre_inscrito" | "pendiente_pago" | "confirmado" | "cancelado";

export type TravelerIdentity = {
  readonly userId: UserId | null;
  readonly email: string;
  readonly fullName: string;
  readonly documentNumber: string | null;
};

export type HealthData = {
  readonly allergies: readonly string[];
  readonly medications: readonly string[];
  readonly emergencyContactName: string | null;
  readonly emergencyContactPhone: string | null;
  readonly raw: Record<string, unknown>;
};

export type Enrollment = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly tripId: EntityId;
  readonly traveler: TravelerIdentity;
  readonly roomType: string | null;
  readonly healthData: HealthData;
  readonly status: EnrollmentStatus;
};

export function assertEnrollmentCanBeConfirmed(enrollment: Enrollment): void {
  if (enrollment.status === "cancelado") {
    throw new Error("Cancelled enrollment cannot be confirmed.");
  }
  if (enrollment.traveler.email.trim().length === 0) {
    throw new Error("Enrollment requires traveler email.");
  }
}
