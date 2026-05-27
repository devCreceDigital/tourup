import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId, parseUserId } from "@totem/shared-kernel";
import { assertPlanLimit, type Route } from "@totem/service-runtime";
import { CancelEnrollment, ConfirmEnrollment, CreatePublicEnrollment, type EnrollmentRepository } from "../../application/enrollment-use-cases.js";
import type { Enrollment, HealthData, TravelerIdentity } from "../../domain/enrollment.js";

function bodyAsRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function stringField(body: Record<string, unknown>, name: string): string {
  const value = body[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function createEnrollmentBusinessRoutes(repository: EnrollmentRepository): readonly Route[] {
  const createPublicEnrollment = new CreatePublicEnrollment(repository);
  const confirmEnrollment = new ConfirmEnrollment(repository);
  const cancelEnrollment = new CancelEnrollment(repository);

  return [
    {
      method: "POST",
      path: "/enrollments/public",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        const traveler: TravelerIdentity = {
          userId: typeof body.userId === "string" ? parseUserId(body.userId) : null,
          email: stringField(body, "email"),
          fullName: stringField(body, "fullName"),
          documentNumber: typeof body.documentNumber === "string" ? body.documentNumber : null
        };
        const healthBody = bodyAsRecord(body.healthData ?? {});
        const healthData: HealthData = {
          allergies: stringArray(healthBody.allergies),
          medications: stringArray(healthBody.medications),
          emergencyContactName: typeof healthBody.emergencyContactName === "string" ? healthBody.emergencyContactName : null,
          emergencyContactPhone: typeof healthBody.emergencyContactPhone === "string" ? healthBody.emergencyContactPhone : null,
          raw: healthBody
        };
        const enrollment: Enrollment = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(stringField(body, "tenantId")),
          tripId: parseEntityId(stringField(body, "tripId")),
          traveler,
          roomType: typeof body.roomType === "string" ? body.roomType : null,
          healthData,
          status: "pre_inscrito"
        };
        if (repository.countByTenant !== undefined) {
          await assertPlanLimit({ tenantId: enrollment.tenantId, resource: "enrollments", currentCount: await repository.countByTenant(enrollment.tenantId) });
        }
        const idempotencyKey =
          typeof body.idempotencyKey === "string"
            ? parseIdempotencyKey(body.idempotencyKey)
            : parseIdempotencyKey(`${traveler.email}:${enrollment.tripId}:public-enrollment`);
        return createPublicEnrollment.execute(enrollment, idempotencyKey, request.context);
      }
    },
    {
      method: "POST",
      path: "/enrollments/confirm",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        return confirmEnrollment.execute(parseEntityId(stringField(body, "enrollmentId")), request.context);
      }
    },
    {
      method: "POST",
      path: "/enrollments/cancel",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        return cancelEnrollment.execute(parseEntityId(stringField(body, "enrollmentId")), request.context);
      }
    }
  ];
}
