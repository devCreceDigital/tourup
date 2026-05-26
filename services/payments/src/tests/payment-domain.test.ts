/**
 * Tests del dominio de pagos — funciones puras, sin IO.
 *
 * Cómo correr:
 *   node --test --import tsx/esm src/tests/payment-domain.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertPaymentCanBeVerified } from "../domain/payment.js";
import type { Payment } from "../domain/payment.js";
import { parseEntityId, parseTenantId } from "@totem/shared-kernel";

// ─── Fixture ───────────────────────────────────────────────────────────────────
function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id:                parseEntityId("11111111-1111-1111-1111-111111111111"),
    tenantId:          parseTenantId("22222222-2222-2222-2222-222222222222"),
    enrollmentId:      parseEntityId("33333333-3333-3333-3333-333333333333"),
    installmentId:     null,
    amount:            { decimal: "1500.00", currency: "PEN" },
    method:            "transferencia",
    status:            "pendiente",
    providerReference: null,
    notes:             "",
    paidAt:            null,
    ...overrides
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe("assertPaymentCanBeVerified", () => {
  it("permite verificar un pago en estado 'pendiente'", () => {
    const payment = makePayment({ status: "pendiente" });
    // No debe lanzar
    assert.doesNotThrow(() => assertPaymentCanBeVerified(payment));
  });

  it("permite verificar un pago ya 'verificado' (operación idempotente)", () => {
    const payment = makePayment({ status: "verificado" });
    assert.doesNotThrow(() => assertPaymentCanBeVerified(payment));
  });

  it("lanza error al intentar verificar un pago 'rechazado'", () => {
    const payment = makePayment({ status: "rechazado" });
    assert.throws(
      () => assertPaymentCanBeVerified(payment),
      { message: "Rejected payment cannot be verified." }
    );
  });
});
