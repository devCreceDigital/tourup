import type { EntityId, IdempotencyKey, Money, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertSubscriptionCanRenew, type Plan, type Subscription } from "../domain/subscription.js";

export interface SubscriptionRepository {
  findPlan(planId: EntityId): Promise<Plan | null>;
  findByTenant(tenantId: TenantId): Promise<Subscription | null>;
  save(subscription: Subscription, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export interface BillingGatewayPort {
  chargeTenant(input: { tenantId: TenantId; amount: Money; idempotencyKey: IdempotencyKey }): Promise<{ providerReference: string }>;
}

export class ChangeTenantPlan {
  constructor(private readonly subscriptions: SubscriptionRepository) {}

  async execute(planId: EntityId, context: TenantContext): Promise<Subscription> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const plan = await this.subscriptions.findPlan(planId);
    if (plan === null || plan.status !== "activo") {
      throw new Error("Plan is not available.");
    }
    const current = await this.subscriptions.findByTenant(tenantId);
    if (current === null) {
      throw new Error("Subscription not found.");
    }
    const updated: Subscription = { ...current, planId, status: "active" };
    await this.subscriptions.save(updated);
    return updated;
  }
}

export class RenewSubscription {
  constructor(private readonly subscriptions: SubscriptionRepository, private readonly billing: BillingGatewayPort, private readonly now: () => string) {}

  async execute(idempotencyKey: IdempotencyKey, context: TenantContext): Promise<Subscription> {
    const tenantId = requireTenant(context);
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (subscription === null) {
      throw new Error("Subscription not found.");
    }
    assertSubscriptionCanRenew(subscription, this.now());
    const plan = await this.subscriptions.findPlan(subscription.planId);
    if (plan === null) {
      throw new Error("Plan not found.");
    }
    await this.billing.chargeTenant({ tenantId, amount: plan.monthlyPrice, idempotencyKey });
    const renewed: Subscription = { ...subscription, status: "active", lastPaymentAttemptAt: this.now() };
    await this.subscriptions.save(renewed, idempotencyKey);
    return renewed;
  }
}
