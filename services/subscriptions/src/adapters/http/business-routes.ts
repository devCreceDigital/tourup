import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { ChangeTenantPlan, RenewSubscription, type BillingGatewayPort, type SubscriptionRepository } from "../../application/subscription-use-cases.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

function integer(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) throw new Error(`${key} must be a non-negative integer.`);
  return value;
}

class ProviderBillingGateway implements BillingGatewayPort {
  async chargeTenant(input: Parameters<BillingGatewayPort["chargeTenant"]>[0]): Promise<{ providerReference: string }> {
    if (process.env.BILLING_PROVIDER_URL === undefined) {
      throw new Error("BILLING_PROVIDER_URL is required.");
    }
    const response = await fetch(process.env.BILLING_PROVIDER_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": String(input.idempotencyKey),
        ...(process.env.SERVICE_INTERNAL_SECRET ? { "x-internal-service-secret": process.env.SERVICE_INTERNAL_SECRET, "x-internal-user-role": "system", "x-internal-tenant-id": String(input.tenantId) } : {})
      },
      body: JSON.stringify({ tenantId: input.tenantId, amount: input.amount })
    });
    if (!response.ok) throw new Error("Billing provider charge failed.");
    return response.json() as Promise<{ providerReference: string }>;
  }

  async createCheckout(input: { tenantId: string; planId: string; successUrl: string; cancelUrl: string }): Promise<Record<string, unknown>> {
    if (process.env.BILLING_PROVIDER_URL === undefined) throw new Error("BILLING_PROVIDER_URL is required.");
    const response = await fetch(`${process.env.BILLING_PROVIDER_URL.replace(/\/$/, "")}/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SERVICE_INTERNAL_SECRET ? { "x-internal-service-secret": process.env.SERVICE_INTERNAL_SECRET, "x-internal-user-role": "system", "x-internal-tenant-id": input.tenantId } : {})
      },
      body: JSON.stringify(input)
    });
    if (!response.ok) throw new Error("Billing provider checkout failed.");
    return response.json() as Promise<Record<string, unknown>>;
  }

  async createPortal(input: { tenantId: string; returnUrl: string }): Promise<Record<string, unknown>> {
    if (process.env.BILLING_PROVIDER_URL === undefined) throw new Error("BILLING_PROVIDER_URL is required.");
    const response = await fetch(`${process.env.BILLING_PROVIDER_URL.replace(/\/$/, "")}/portal`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SERVICE_INTERNAL_SECRET ? { "x-internal-service-secret": process.env.SERVICE_INTERNAL_SECRET, "x-internal-user-role": "system", "x-internal-tenant-id": input.tenantId } : {})
      },
      body: JSON.stringify(input)
    });
    if (!response.ok) throw new Error("Billing provider portal failed.");
    return response.json() as Promise<Record<string, unknown>>;
  }
}

export function createSubscriptionBusinessRoutes(repository: SubscriptionRepository): readonly Route[] {
  const changePlan = new ChangeTenantPlan(repository);
  const billingGateway = new ProviderBillingGateway();
  const renew = new RenewSubscription(repository, billingGateway, () => new Date().toISOString());
  return [
    {
      method: "POST",
      path: "/subscriptions/change-plan",
      handler: async (request) => changePlan.execute(parseEntityId(text(record(request.body), "planId")), request.context)
    },
    {
      method: "POST",
      path: "/subscriptions/renew",
      handler: async (request) => renew.execute(parseIdempotencyKey(text(record(request.body), "idempotencyKey")), request.context)
    },
    {
      method: "POST",
      path: "/subscriptions/checkout",
      handler: async (request) => {
        const tenantId = request.context.tenantId;
        if (tenantId === null) throw new Error("Tenant context is required.");
        const body = record(request.body);
        const plan = await repository.findPlan(parseEntityId(text(body, "planId")));
        if (plan === null || plan.status !== "activo") throw new Error("Plan is not available.");
        return billingGateway.createCheckout({
          tenantId: String(tenantId),
          planId: String(plan.id),
          successUrl: text(body, "successUrl"),
          cancelUrl: text(body, "cancelUrl")
        });
      }
    },
    {
      method: "POST",
      path: "/subscriptions/portal",
      handler: async (request) => {
        const tenantId = request.context.tenantId;
        if (tenantId === null) throw new Error("Tenant context is required.");
        return billingGateway.createPortal({ tenantId: String(tenantId), returnUrl: text(record(request.body), "returnUrl") });
      }
    },
    {
      method: "POST",
      path: "/subscriptions/webhook/provider",
      handler: async (request) => {
        const body = record(request.body);
        const eventType = text(body, "type");
        const tenantId = parseTenantId(text(body, "tenantId"));
        const subscription = await repository.findByTenant(tenantId);
        if (subscription === null) return { received: true, applied: false, reason: "Subscription not found." };
        if (eventType !== "subscription.active" && eventType !== "subscription.past_due" && eventType !== "subscription.cancelled") {
          return { received: true, applied: false, reason: "Ignored event type." };
        }
        const status = eventType === "subscription.active" ? "active" : eventType === "subscription.past_due" ? "past_due" : "cancelled";
        await repository.save({ ...subscription, status, providerSubscriptionId: typeof body.providerSubscriptionId === "string" ? body.providerSubscriptionId : subscription.providerSubscriptionId });
        return { received: true, applied: true, status };
      }
    },
    {
      method: "POST",
      path: "/subscriptions/limits/check",
      handler: async (request) => {
        const body = record(request.body);
        const tenantId = request.context.tenantId;
        if (tenantId === null) throw new Error("Tenant context is required.");
        const subscription = await repository.findByTenant(tenantId);
        if (subscription === null || subscription.status === "cancelled" || subscription.status === "suspended") {
          return { allowed: false, reason: "Subscription is not active." };
        }
        const plan = await repository.findPlan(subscription.planId);
        if (plan === null || plan.status !== "activo") return { allowed: false, reason: "Plan is not active." };
        const resource = text(body, "resource");
        const currentCount = integer(body, "currentCount");
        const requestedCount = integer({ ...body, requestedCount: body.requestedCount ?? 1 }, "requestedCount");
        const rawLimit = plan.limits[resource];
        const limit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : null;
        const allowed = limit === null || currentCount + requestedCount <= limit;
        return {
          allowed,
          resource,
          limit,
          currentCount,
          requestedCount,
          reason: allowed ? null : `Plan limit exceeded for ${resource}.`
        };
      }
    }
  ];
}
