import type { EntityId, Money, TenantId } from "@totem/shared-kernel";

export type PlanStatus = "activo" | "inactivo";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "suspended";

export type Plan = {
  readonly id: EntityId;
  readonly name: string;
  readonly monthlyPrice: Money;
  readonly annualPrice: Money | null;
  readonly status: PlanStatus;
  readonly limits: Record<string, unknown>;
};

export type Subscription = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly planId: EntityId;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly providerSubscriptionId: string | null;
  readonly lastPaymentAttemptAt: string | null;
};

export function assertSubscriptionCanRenew(subscription: Subscription, now: string): void {
  if (subscription.status === "cancelled" || subscription.status === "suspended") {
    throw new Error("Subscription cannot renew from terminal state.");
  }
  if (subscription.lastPaymentAttemptAt !== null && subscription.lastPaymentAttemptAt.slice(0, 10) === now.slice(0, 10)) {
    throw new Error("Subscription already attempted renewal today.");
  }
}
