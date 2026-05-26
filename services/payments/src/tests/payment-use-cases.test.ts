/**
 * Tests de los use cases de pagos.
 *
 * Usa un repositorio en memoria — sin base de datos.
 *
 * Cómo correr:
 *   node --test --import tsx/esm src/tests/payment-use-cases.test.ts
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { RegisterManualPayment, RejectPayment, VerifyPayment, type PaymentRepository } from "../application/payment-use-cases.js";
import type { Payment } from "../domain/payment.js";
import { ForbiddenError, NotFoundError, parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";

// ─── Repositorio en memoria ────────────────────────────────────────────────────
class InMemoryPaymentRepository implements PaymentRepository {
  private readonly store = new Map<string, Payment>();

  async findById(tenantId: TenantId, paymentId: EntityId): Promise<Payment | null> {
    const p = this.store.get(String(paymentId));
    if (p === undefined) return null;
    if (String(p.tenantId) !== String(tenantId)) return null;
    return p;
  }

  async findByProviderReference(tenantId: TenantId, ref: string): Promise<Payment | null> {
    for (const p of this.store.values()) {
      if (p.providerReference === ref && String(p.tenantId) === String(tenantId)) return p;
    }
    return null;
  }

  async save(payment: Payment): Promise<void> {
    this.store.set(String(payment.id), payment);
  }

  /** Helper de test para pre-cargar un pago */
  seed(payment: Payment): void {
    this.store.set(String(payment.id), payment);
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const TENANT_ID  = parseTenantId("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
const PAYMENT_ID = parseEntityId("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
const ENROLL_ID  = parseEntityId("cccccccc-cccc-cccc-cccc-cccccccccccc");

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id:                PAYMENT_ID,
    tenantId:          TENANT_ID,
    enrollmentId:      ENROLL_ID,
    installmentId:     null,
    amount:            { decimal: "500.00", currency: "PEN" },
    method:            "transferencia",
    status:            "pendiente",
    providerReference: null,
    notes:             "",
    paidAt:            null,
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

function viajeroContext(): TenantContext {
  return { ...adminContext(), role: "viajero" };
}

function idKey(suffix: string): IdempotencyKey {
  return parseIdempotencyKey(`test-idempotency-key-${suffix}`);
}

// ─── RegisterManualPayment ─────────────────────────────────────────────────────
describe("RegisterManualPayment", () => {
  let repo: InMemoryPaymentRepository;

  beforeEach(() => {
    repo = new InMemoryPaymentRepository();
  });

  it("registra un pago manual con estado 'verificado'", async () => {
    const uc     = new RegisterManualPayment(repo);
    const input  = makePayment({ status: "pendiente" });
    const result = await uc.execute(input, idKey("register-01"), adminContext());

    assert.equal(result.status, "verificado");
    assert.equal(String(result.id), String(PAYMENT_ID));
  });

  it("retorna el pago existente si el providerReference ya fue registrado (idempotencia)", async () => {
    const existing = makePayment({ status: "verificado", providerReference: "ref-abc" });
    repo.seed(existing);

    const uc    = new RegisterManualPayment(repo);
    const input = makePayment({ providerReference: "ref-abc" });
    const result = await uc.execute(input, idKey("register-02"), adminContext());

    assert.equal(result.status, "verificado");
    assert.equal(result.providerReference, "ref-abc");
  });

  it("lanza ForbiddenError (403) si el contexto no es admin", async () => {
    const uc    = new RegisterManualPayment(repo);
    const input = makePayment();
    await assert.rejects(
      () => uc.execute(input, idKey("register-03"), viajeroContext()),
      (err) => {
        assert.ok(err instanceof ForbiddenError, `Expected ForbiddenError, got ${(err as Error).constructor.name}`);
        assert.equal((err as ForbiddenError).statusCode, 403);
        return true;
      }
    );
  });
});

// ─── VerifyPayment ─────────────────────────────────────────────────────────────
describe("VerifyPayment", () => {
  let repo: InMemoryPaymentRepository;

  beforeEach(() => {
    repo = new InMemoryPaymentRepository();
  });

  it("verifica un pago pendiente y lo pone en estado 'verificado'", async () => {
    repo.seed(makePayment({ status: "pendiente" }));
    const uc     = new VerifyPayment(repo);
    const result = await uc.execute(PAYMENT_ID, adminContext());

    assert.equal(result.status, "verificado");
  });

  it("lanza NotFoundError (404) si el pago no existe", async () => {
    const uc = new VerifyPayment(repo);
    await assert.rejects(
      () => uc.execute(PAYMENT_ID, adminContext()),
      (err) => {
        assert.ok(err instanceof NotFoundError, `Expected NotFoundError, got ${(err as Error).constructor.name}`);
        assert.equal((err as NotFoundError).statusCode, 404);
        return true;
      }
    );
  });

  it("lanza error al intentar verificar un pago rechazado", async () => {
    repo.seed(makePayment({ status: "rechazado" }));
    const uc = new VerifyPayment(repo);
    await assert.rejects(
      () => uc.execute(PAYMENT_ID, adminContext()),
      { message: "Rejected payment cannot be verified." }
    );
  });

  it("lanza ForbiddenError (403) si el contexto no es admin", async () => {
    repo.seed(makePayment());
    const uc = new VerifyPayment(repo);
    await assert.rejects(
      () => uc.execute(PAYMENT_ID, viajeroContext()),
      (err) => {
        assert.ok(err instanceof ForbiddenError);
        return true;
      }
    );
  });
});

// ─── RejectPayment ─────────────────────────────────────────────────────────────
describe("RejectPayment", () => {
  let repo: InMemoryPaymentRepository;

  beforeEach(() => {
    repo = new InMemoryPaymentRepository();
  });

  it("rechaza un pago y guarda la razón en notes", async () => {
    repo.seed(makePayment({ status: "pendiente" }));
    const uc     = new RejectPayment(repo);
    const result = await uc.execute(
      { paymentId: PAYMENT_ID, reason: "Comprobante inválido." },
      adminContext()
    );

    assert.equal(result.status, "rechazado");
    assert.equal(result.notes, "Comprobante inválido.");
  });

  it("lanza NotFoundError (404) si el pago no existe", async () => {
    const uc = new RejectPayment(repo);
    await assert.rejects(
      () => uc.execute({ paymentId: PAYMENT_ID, reason: "razón" }, adminContext()),
      (err) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal((err as NotFoundError).statusCode, 404);
        return true;
      }
    );
  });

  it("lanza ForbiddenError (403) si el contexto no es admin", async () => {
    repo.seed(makePayment());
    const uc = new RejectPayment(repo);
    await assert.rejects(
      () => uc.execute({ paymentId: PAYMENT_ID, reason: "razón" }, viajeroContext()),
      (err) => {
        assert.ok(err instanceof ForbiddenError);
        return true;
      }
    );
  });
});
