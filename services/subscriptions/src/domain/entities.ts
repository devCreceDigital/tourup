import type { EntityId, TenantId } from "@totem/shared-kernel";
import { SubscriptionInvariantViolation } from "./errors.js";

export type SubscriptionStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type SubscriptionSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: SubscriptionStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class Subscription {
  private constructor(private readonly state: SubscriptionSnapshot) {}

  static create(input: Omit<SubscriptionSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): Subscription {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new SubscriptionInvariantViolation("A new subscription cannot start in a terminal state.");
    }
    return new Subscription({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: SubscriptionSnapshot): Subscription {
    return new Subscription(snapshot);
  }

  changeStatus(status: SubscriptionStatus, now: string): Subscription {
    if (this.state.status === "archived" && status !== "archived") {
      throw new SubscriptionInvariantViolation("Archived subscription cannot be reactivated without a dedicated restoration use case.");
    }
    return new Subscription({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): Subscription {
    return new Subscription({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): SubscriptionSnapshot {
    return this.state;
  }
}
