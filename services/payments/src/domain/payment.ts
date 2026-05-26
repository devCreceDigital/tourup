import type { EntityId, Money, TenantId } from "@totem/shared-kernel";

export type PaymentMethod = "transferencia" | "efectivo" | "tarjeta" | "mercadopago" | "otro";
export type PaymentStatus = "pendiente" | "verificado" | "rechazado";

export type Installment = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly tripId: EntityId;
  readonly name: string;
  readonly amount: Money;
  readonly dueDate: string;
  readonly required: boolean;
};

export type Payment = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly enrollmentId: EntityId;
  readonly installmentId: EntityId | null;
  readonly amount: Money;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly providerReference: string | null;
  readonly notes: string;
  readonly paidAt: string | null;
};

export function assertPaymentCanBeVerified(payment: Payment): void {
  if (payment.status === "rechazado") {
    throw new Error("Rejected payment cannot be verified.");
  }
}
