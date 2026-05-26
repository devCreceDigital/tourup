/**
 * Tests de los use cases de inscripciones.
 *
 * Cómo correr:
 *   node --test --import tsx/esm src/tests/enrollment-use-cases.test.ts
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CancelEnrollment, ConfirmEnrollment, CreatePublicEnrollment, type EnrollmentRepository } from "../application/enrollment-use-cases.js";
import type { Enrollment } from "../domain/enrollment.js";
import { ForbiddenError, NotFoundError, parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";

// ─── Repositorio en memoria ────────────────────────────────────────────────────
class InMemoryEnrollmentRepository implements EnrollmentRepository {
  private readonly store = new Map<string, Enrollment>();

  async findById(tenantId: TenantId, enrollmentId: EntityId): Promise<Enrollment | null> {
    const e = this.store.get(String(enrollmentId));
    if (e === undefined) return null;
    if (String(e.tenantId) !== String(tenantId)) return null;
    return e;
  }

  async findByNaturalKey(
    tenantId: TenantId,
    tripId: EntityId,
    email: string,
    documentNumber: string | null
  ): Promise<Enrollment | null> {
    for (const e of this.store.values()) {
      if (
        String(e.tenantId) === String(tenantId) &&
        String(e.tripId) === String(tripId) &&
        e.traveler.email === email &&
        e.traveler.documentNumber === documentNumber
      ) {
        return e;
      }
    }
    return null;
  }

  async save(enrollment: Enrollment): Promise<void> {
    this.store.set(String(enrollment.id), enrollment);
  }

  seed(enrollment: Enrollment): void {
    this.store.set(String(enrollment.id), enrollment);
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const TENANT_ID = parseTenantId("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
const TRIP_ID   = parseEntityId("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
const ENROLL_ID = parseEntityId("cccccccc-cccc-cccc-cccc-cccccccccccc");

function makeEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id:       ENROLL_ID,
    tenantId: TENANT_ID,
    tripId:   TRIP_ID,
    traveler: {
      userId:         null,
      email:          "viajero@test.com",
      fullName:       "Juan Pérez",
      documentNumber: "12345678"
    },
    roomType: null,
    healthData: {
      allergies:              [],
      medications:            [],
      emergencyContactName:   null,
      emergencyContactPhone:  null,
      raw:                    {}
    },
    status: "pre_inscrito",
    ...overrides
  };
}

function adminContext(): TenantContext {
  return {
    tenantId:  TENANT_ID,
    businessId: TENANT_ID,
    userId:    parseEntityId("dddddddd-dddd-dddd-dddd-dddddddddddd") as unknown as ReturnType<typeof parseTenantId>,
    userEmail: "admin@test.com",
    role:      "admin",
    requestId: "req-test-001",
    isPublic:  false
  };
}

function publicContext(): TenantContext {
  return { ...adminContext(), role: "anonymous", isPublic: true };
}

function viajeroContext(): TenantContext {
  return { ...adminContext(), role: "viajero" };
}

function idKey(suffix: string): IdempotencyKey {
  return parseIdempotencyKey(`test-idempotency-key-${suffix}`);
}

// ─── CreatePublicEnrollment ────────────────────────────────────────────────────
describe("CreatePublicEnrollment", () => {
  let repo: InMemoryEnrollmentRepository;

  beforeEach(() => {
    repo = new InMemoryEnrollmentRepository();
  });

  it("crea una inscripción nueva con estado 'pre_inscrito'", async () => {
    const uc     = new CreatePublicEnrollment(repo);
    const input  = makeEnrollment();
    const result = await uc.execute(input, idKey("create-01"), publicContext());

    assert.equal(result.status, "pre_inscrito");
    assert.equal(result.traveler.email, "viajero@test.com");
    assert.equal(String(result.tenantId), String(TENANT_ID));
  });

  it("retorna inscripción existente si el mismo email+trip ya existe (idempotencia)", async () => {
    const existing = makeEnrollment({ status: "confirmado" });
    repo.seed(existing);

    const uc     = new CreatePublicEnrollment(repo);
    const input  = makeEnrollment({ id: parseEntityId("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee") });
    const result = await uc.execute(input, idKey("create-02"), publicContext());

    // Retorna el existente, no crea uno nuevo
    assert.equal(result.status, "confirmado");
    assert.equal(String(result.id), String(ENROLL_ID));
  });
});

// ─── ConfirmEnrollment ─────────────────────────────────────────────────────────
describe("ConfirmEnrollment", () => {
  let repo: InMemoryEnrollmentRepository;

  beforeEach(() => {
    repo = new InMemoryEnrollmentRepository();
  });

  it("confirma una inscripción y la pone en estado 'confirmado'", async () => {
    repo.seed(makeEnrollment({ status: "pre_inscrito" }));
    const uc     = new ConfirmEnrollment(repo);
    const result = await uc.execute(ENROLL_ID, adminContext());

    assert.equal(result.status, "confirmado");
  });

  it("lanza NotFoundError (404) si la inscripción no existe", async () => {
    const uc = new ConfirmEnrollment(repo);
    await assert.rejects(
      () => uc.execute(ENROLL_ID, adminContext()),
      (err) => {
        assert.ok(err instanceof NotFoundError, `Expected NotFoundError, got ${(err as Error).constructor.name}`);
        assert.equal((err as NotFoundError).statusCode, 404);
        return true;
      }
    );
  });

  it("lanza error al confirmar una inscripción cancelada", async () => {
    repo.seed(makeEnrollment({ status: "cancelado" }));
    const uc = new ConfirmEnrollment(repo);
    await assert.rejects(
      () => uc.execute(ENROLL_ID, adminContext()),
      { message: "Cancelled enrollment cannot be confirmed." }
    );
  });

  it("lanza ForbiddenError (403) si el contexto no es admin", async () => {
    repo.seed(makeEnrollment());
    const uc = new ConfirmEnrollment(repo);
    await assert.rejects(
      () => uc.execute(ENROLL_ID, viajeroContext()),
      (err) => {
        assert.ok(err instanceof ForbiddenError, `Expected ForbiddenError, got ${(err as Error).constructor.name}`);
        assert.equal((err as ForbiddenError).statusCode, 403);
        return true;
      }
    );
  });
});

// ─── CancelEnrollment ─────────────────────────────────────────────────────────
describe("CancelEnrollment", () => {
  let repo: InMemoryEnrollmentRepository;

  beforeEach(() => {
    repo = new InMemoryEnrollmentRepository();
  });

  it("cancela una inscripción y la pone en estado 'cancelado'", async () => {
    repo.seed(makeEnrollment({ status: "pre_inscrito" }));
    const uc     = new CancelEnrollment(repo);
    const result = await uc.execute(ENROLL_ID, adminContext());

    assert.equal(result.status, "cancelado");
  });

  it("lanza NotFoundError (404) si la inscripción no existe", async () => {
    const uc = new CancelEnrollment(repo);
    await assert.rejects(
      () => uc.execute(ENROLL_ID, adminContext()),
      (err) => {
        assert.ok(err instanceof NotFoundError);
        return true;
      }
    );
  });

  it("lanza ForbiddenError (403) si el contexto no es admin", async () => {
    repo.seed(makeEnrollment());
    const uc = new CancelEnrollment(repo);
    await assert.rejects(
      () => uc.execute(ENROLL_ID, viajeroContext()),
      (err) => {
        assert.ok(err instanceof ForbiddenError);
        return true;
      }
    );
  });
});
