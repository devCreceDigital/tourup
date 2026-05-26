import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { EnrollmentRepository } from "../../application/enrollment-use-cases.js";
import type { Enrollment } from "../../domain/enrollment.js";

function asEnrollment(payload: unknown): Enrollment {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Enrollment payload is not an object.");
  }
  return payload as Enrollment;
}

function naturalDocumentKey(documentNumber: string | null): string {
  return documentNumber === null ? "documento-no-declarado" : documentNumber;
}

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByNaturalKey(tenantId: TenantId, tripId: EntityId, email: string, documentNumber: string | null): Promise<Enrollment | null> {
    const naturalKey = await this.prisma.enrollmentNaturalKey.findFirst({
      where: { tenantId: String(tenantId), tripId: String(tripId), email, documentNumber: naturalDocumentKey(documentNumber) }
    });
    if (naturalKey === null) {
      return null;
    }
    return this.findById(tenantId, naturalKey.enrollmentId as EntityId);
  }

  async findById(tenantId: TenantId, enrollmentId: EntityId): Promise<Enrollment | null> {
    const record = await this.prisma.enrollmentRecord.findFirst({
      where: { id: String(enrollmentId), tenantId: String(tenantId) }
    });
    return record === null ? null : asEnrollment(record.payload);
  }

  async countByTenant(tenantId: TenantId): Promise<number> {
    return this.prisma.enrollmentRecord.count({ where: { tenantId: String(tenantId) } });
  }

  async save(enrollment: Enrollment, idempotencyKey?: IdempotencyKey): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const where = idempotencyKey === undefined ? { id: String(enrollment.id) } : { idempotencyKey: String(idempotencyKey) };
      await tx.enrollmentRecord.upsert({
        where,
        create: {
          id: String(enrollment.id),
          tenantId: String(enrollment.tenantId),
          status: enrollment.status,
          version: 1,
          idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
          payload: toJsonObject(enrollment)
        },
        update: {
          status: enrollment.status,
          ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
          payload: toJsonObject(enrollment)
        }
      });
      await tx.enrollmentNaturalKey.upsert({
        where: {
          tenantId_tripId_email_documentNumber: {
            tenantId: String(enrollment.tenantId),
            tripId: String(enrollment.tripId),
            email: enrollment.traveler.email,
            documentNumber: naturalDocumentKey(enrollment.traveler.documentNumber)
          }
        },
        create: {
          id: String(enrollment.id),
          tenantId: String(enrollment.tenantId),
          tripId: String(enrollment.tripId),
          email: enrollment.traveler.email,
          documentNumber: naturalDocumentKey(enrollment.traveler.documentNumber),
          enrollmentId: String(enrollment.id)
        },
        update: { enrollmentId: String(enrollment.id) }
      });
      await publishOutboxEvent(tx, {
        aggregateId: String(enrollment.id),
        tenantId: enrollment.tenantId,
        eventType: `enrollments.enrollment.${enrollment.status}`,
        payload: { enrollmentId: String(enrollment.id), tripId: String(enrollment.tripId), status: enrollment.status, travelerEmail: enrollment.traveler.email }
      });
    });
  }
}
