import { randomUUID } from "node:crypto";
import { parseEntityId, parseTenantId, toJsonObject } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { GetPlatformMetrics, SuspendTenant, type PlatformRepository } from "../../application/platform-use-cases.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

function optionalText(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function createPlatformBusinessRoutes(repository: PlatformRepository, prisma: PrismaClient): readonly Route[] {
  const metrics = new GetPlatformMetrics(repository);
  const suspendTenant = new SuspendTenant(repository);
  return [
    { method: "GET", path: "/platform/metrics", handler: async (request) => metrics.execute(request.context) },
    { method: "POST", path: "/platform/tenants/suspend", handler: async (request) => suspendTenant.execute(parseEntityId(text(record(request.body), "tenantId")), request.context) },
    {
      method: "POST",
      path: "/platform/events/ingest",
      handler: async (request) => {
        if (request.context.role !== "system") throw new Error("System role is required.");
        const body = record(request.body);
        const id = optionalText(body, "id") ?? randomUUID();
        const tenantId = optionalText(body, "tenantId");
        await prisma.eventBusEventRecord.upsert({
          where: { id },
          create: {
            id,
            tenantId,
            source: text(body, "source"),
            eventType: text(body, "type"),
            aggregateId: optionalText(body, "aggregateId"),
            payload: toJsonObject(body)
          },
          update: { payload: toJsonObject(body) }
        });
        return { received: true, id };
      }
    },
    {
      method: "GET",
      path: "/platform/events",
      handler: async (request) => {
        const tenantId = request.context.tenantId;
        const events = await prisma.eventBusEventRecord.findMany({
          where: tenantId === null ? {} : { tenantId: String(tenantId) },
          orderBy: { receivedAt: "desc" },
          take: 100
        });
        return {
          events: events.map((event) => ({
            id: event.id,
            tenantId: event.tenantId,
            source: event.source,
            type: event.eventType,
            aggregateId: event.aggregateId,
            receivedAt: event.receivedAt.toISOString(),
            payload: event.payload
          }))
        };
      }
    },
    {
      method: "POST",
      path: "/platform/billing-provider/checkout",
      handler: async (request) => {
        if (request.context.role !== "system") throw new Error("System role is required.");
        const body = record(request.body);
        const tenantId = parseTenantId(text(body, "tenantId"));
        const planId = parseEntityId(text(body, "planId"));
        const id = randomUUID();
        const payload = toJsonObject({
          tenantId: String(tenantId),
          planId: String(planId),
          successUrl: text(body, "successUrl"),
          cancelUrl: text(body, "cancelUrl")
        });
        await prisma.billingProviderSessionRecord.create({
          data: { id, tenantId: String(tenantId), planId: String(planId), kind: "checkout", status: "open", payload }
        });
        return {
          provider: "totem-internal",
          providerReference: id,
          checkoutUrl: `/platform/billing-provider/checkout/${id}`,
          status: "open"
        };
      }
    },
    {
      method: "POST",
      path: "/platform/billing-provider/portal",
      handler: async (request) => {
        if (request.context.role !== "system") throw new Error("System role is required.");
        const body = record(request.body);
        const tenantId = parseTenantId(text(body, "tenantId"));
        const id = randomUUID();
        const payload = toJsonObject({ tenantId: String(tenantId), returnUrl: text(body, "returnUrl") });
        await prisma.billingProviderSessionRecord.create({
          data: { id, tenantId: String(tenantId), planId: null, kind: "portal", status: "open", payload }
        });
        return {
          provider: "totem-internal",
          providerReference: id,
          portalUrl: `/platform/billing-provider/portal/${id}`,
          status: "open"
        };
      }
    }
  ];
}
