import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { PaymentRepository } from "../../application/payment-use-cases.js";
import type { Payment } from "../../domain/payment.js";

function asPayment(payload: unknown): Payment {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Payment payload is not an object.");
  }
  return payload as Payment;
}

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByProviderReference(tenantId: TenantId, providerReference: string): Promise<Payment | null> {
    const record = await this.prisma.paymentRecord.findFirst({
      where: {
        tenantId: String(tenantId),
        payload: { path: ["providerReference"], equals: providerReference }
      }
    });
    return record === null ? null : asPayment(record.payload);
  }

  async findById(tenantId: TenantId, paymentId: EntityId): Promise<Payment | null> {
    const record = await this.prisma.paymentRecord.findFirst({
      where: { id: String(paymentId), tenantId: String(tenantId) }
    });
    return record === null ? null : asPayment(record.payload);
  }

  async save(payment: Payment, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(payment.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.paymentRecord.upsert({
      where,
      create: {
        id: String(payment.id),
        tenantId: String(payment.tenantId),
        status: payment.status,
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(payment)
      },
      update: {
        status: payment.status,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: toJsonObject(payment)
      }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(payment.id),
      tenantId: payment.tenantId,
      eventType: `payments.payment.${payment.status}`,
      payload: { paymentId: String(payment.id), enrollmentId: String(payment.enrollmentId), status: payment.status, method: payment.method }
    });
  }
}
