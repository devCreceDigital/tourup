import type { EntityId, TenantId } from "@totem/shared-kernel";
import { PaymentInvariantViolation } from "./errors.js";

export type PaymentStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type PaymentSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: PaymentStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class Payment {
  private constructor(private readonly state: PaymentSnapshot) {}

  static create(input: Omit<PaymentSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): Payment {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new PaymentInvariantViolation("A new payment cannot start in a terminal state.");
    }
    return new Payment({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: PaymentSnapshot): Payment {
    return new Payment(snapshot);
  }

  changeStatus(status: PaymentStatus, now: string): Payment {
    if (this.state.status === "archived" && status !== "archived") {
      throw new PaymentInvariantViolation("Archived payment cannot be reactivated without a dedicated restoration use case.");
    }
    return new Payment({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): Payment {
    return new Payment({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): PaymentSnapshot {
    return this.state;
  }
}
