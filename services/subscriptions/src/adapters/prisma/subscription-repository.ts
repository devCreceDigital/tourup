import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { SubscriptionRepository } from "../../application/subscription-use-cases.js";
import type { Plan, Subscription } from "../../domain/subscription.js";

function asSubscription(payload: unknown): Subscription {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new Error("Subscription payload is not an object.");
  return payload as Subscription;
}

function asPlan(payload: unknown): Plan {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new Error("Plan payload is not an object.");
  return payload as Plan;
}

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPlan(planId: EntityId): Promise<Plan | null> {
    const record = await this.prisma.subscriptionRecord.findFirst({
      where: { id: String(planId), payload: { path: ["kind"], equals: "plan" } }
    });
    return record === null ? null : asPlan(record.payload);
  }

  async findByTenant(tenantId: TenantId): Promise<Subscription | null> {
    const record = await this.prisma.subscriptionRecord.findFirst({
      where: { tenantId: String(tenantId), payload: { path: ["kind"], equals: "subscription" } }
    });
    return record === null ? null : asSubscription(record.payload);
  }

  async save(subscription: Subscription, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(subscription.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.subscriptionRecord.upsert({
      where,
      create: {
        id: String(subscription.id),
        tenantId: String(subscription.tenantId),
        status: subscription.status,
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject({ ...subscription, kind: "subscription" })
      },
      update: { status: subscription.status, ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }), payload: toJsonObject({ ...subscription, kind: "subscription" }) }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(subscription.id),
      tenantId: subscription.tenantId,
      eventType: `subscriptions.subscription.${subscription.status}`,
      payload: { subscriptionId: String(subscription.id), planId: String(subscription.planId), status: subscription.status }
    });
  }
}
