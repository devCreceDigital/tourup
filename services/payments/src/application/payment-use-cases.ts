import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { NotFoundError, assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertPaymentCanBeVerified, type Payment } from "../domain/payment.js";

export interface PaymentRepository {
  findByProviderReference(tenantId: TenantId, providerReference: string): Promise<Payment | null>;
  findById(tenantId: TenantId, paymentId: EntityId): Promise<Payment | null>;
  save(payment: Payment, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class RegisterManualPayment {
  constructor(private readonly payments: PaymentRepository) {}

  async execute(payment: Payment, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<Payment> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    if (payment.providerReference !== null) {
      const existing = await this.payments.findByProviderReference(tenantId, payment.providerReference);
      if (existing !== null) {
        return existing;
      }
    }
    const registered: Payment = { ...payment, tenantId, status: "verificado" };
    await this.payments.save(registered, idempotencyKey);
    return registered;
  }
}

export class VerifyPayment {
  constructor(private readonly payments: PaymentRepository) {}

  async execute(paymentId: EntityId, context: TenantContext): Promise<Payment> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const payment = await this.payments.findById(tenantId, paymentId);
    if (payment === null) {
      throw new NotFoundError("Payment not found.");
    }
    assertPaymentCanBeVerified(payment);
    const verified: Payment = { ...payment, status: "verificado" };
    await this.payments.save(verified);
    return verified;
  }
}

export class RejectPayment {
  constructor(private readonly payments: PaymentRepository) {}

  async execute(input: { readonly paymentId: EntityId; readonly reason: string }, context: TenantContext): Promise<Payment> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const payment = await this.payments.findById(tenantId, input.paymentId);
    if (payment === null) {
      throw new NotFoundError("Payment not found.");
    }
    const rejected: Payment = { ...payment, status: "rechazado", notes: input.reason };
    await this.payments.save(rejected);
    return rejected;
  }
}
