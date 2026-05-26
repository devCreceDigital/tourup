import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { PaymentStatus } from "../domain/entities.js";

export type CreatePaymentCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: PaymentStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdatePaymentCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangePaymentStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: PaymentStatus;
};

export type PaymentsCommandName =
  | "RegisterManualPayment"
  | "ProcessPaymentWebhook"
  | "ChangePaymentStatus"
  | "ReconcilePayment";
