import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant, tenantScope } from "@totem/shared-kernel";
import { assertEnrollmentCanBeConfirmed, type Enrollment } from "../domain/enrollment.js";

export interface EnrollmentRepository {
  findByNaturalKey(tenantId: TenantId, tripId: EntityId, email: string, documentNumber: string | null): Promise<Enrollment | null>;
  findById(tenantId: TenantId, enrollmentId: EntityId): Promise<Enrollment | null>;
  countByTenant?(tenantId: TenantId): Promise<number>;
  save(enrollment: Enrollment, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class CreatePublicEnrollment {
  constructor(private readonly enrollments: EnrollmentRepository) {}

  async execute(enrollment: Enrollment, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<Enrollment> {
    const tenantId = context.isPublic ? enrollment.tenantId : tenantScope(context, enrollment.tenantId) ?? requireTenant(context);
    const existing = await this.enrollments.findByNaturalKey(
      tenantId,
      enrollment.tripId,
      enrollment.traveler.email,
      enrollment.traveler.documentNumber
    );
    if (existing !== null) {
      return existing;
    }
    const created: Enrollment = { ...enrollment, tenantId, status: "pre_inscrito" };
    await this.enrollments.save(created, idempotencyKey);
    return created;
  }
}

export class ConfirmEnrollment {
  constructor(private readonly enrollments: EnrollmentRepository) {}

  async execute(enrollmentId: EntityId, context: TenantContext): Promise<Enrollment> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const enrollment = await this.enrollments.findById(tenantId, enrollmentId);
    if (enrollment === null) {
      throw new Error("Enrollment not found.");
    }
    assertEnrollmentCanBeConfirmed(enrollment);
    const confirmed: Enrollment = { ...enrollment, status: "confirmado" };
    await this.enrollments.save(confirmed);
    return confirmed;
  }
}

export class CancelEnrollment {
  constructor(private readonly enrollments: EnrollmentRepository) {}

  async execute(enrollmentId: EntityId, context: TenantContext): Promise<Enrollment> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const enrollment = await this.enrollments.findById(tenantId, enrollmentId);
    if (enrollment === null) {
      throw new Error("Enrollment not found.");
    }
    const cancelled: Enrollment = { ...enrollment, status: "cancelado" };
    await this.enrollments.save(cancelled);
    return cancelled;
  }
}
