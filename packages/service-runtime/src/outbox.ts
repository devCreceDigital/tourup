import { randomUUID } from "node:crypto";
import { toJsonObject, type TenantId } from "@totem/shared-kernel";
import { createLogger } from "./logger.js";

type OutboxClient = {
  readonly outboxEvent?: {
    readonly create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    readonly findMany: (args: Record<string, unknown>) => Promise<readonly { id: string; eventType: string; tenantId: string | null; aggregateId: string; payload: unknown; occurredAt: Date }[]>;
    readonly update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  };
};

function asOutboxClient(client: unknown): OutboxClient {
  return typeof client === "object" && client !== null ? client as OutboxClient : {};
}

export async function publishOutboxEvent(client: unknown, input: {
  readonly aggregateId: string;
  readonly tenantId: TenantId | null;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
}): Promise<void> {
  const outboxClient = asOutboxClient(client);
  if (outboxClient.outboxEvent === undefined) return;
  await outboxClient.outboxEvent.create({
    data: {
      id: randomUUID(),
      aggregateId: input.aggregateId,
      tenantId: input.tenantId === null ? null : String(input.tenantId),
      eventType: input.eventType,
      payload: toJsonObject(input.payload)
    }
  });
}

export function startOutboxProcessor(serviceName: string, client: unknown): void {
  const eventBusUrl = process.env.EVENT_BUS_URL;
  const intervalMs = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? "5000");
  const outboxClient = asOutboxClient(client);
  if (outboxClient.outboxEvent === undefined || typeof eventBusUrl !== "string" || eventBusUrl.trim().length === 0) return;

  const log = createLogger(serviceName);
  const target = eventBusUrl.replace(/\/$/, "");

  const dispatchEvent = async (event: {
    id: string;
    eventType: string;
    tenantId: string | null;
    aggregateId: string;
    payload: unknown;
    occurredAt: Date;
  }): Promise<void> => {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SERVICE_INTERNAL_SECRET ? { "x-internal-service-secret": process.env.SERVICE_INTERNAL_SECRET } : {}),
        ...(event.tenantId === null ? {} : { "x-internal-tenant-id": event.tenantId }),
        "x-internal-user-role": "system",
        "x-event-source": serviceName
      },
      body: JSON.stringify({
        id: event.id,
        source: serviceName,
        type: event.eventType,
        tenantId: event.tenantId,
        aggregateId: event.aggregateId,
        payload: event.payload,
        occurredAt: event.occurredAt.toISOString()
      })
    });
    if (!response.ok) {
      throw new Error(`Event bus responded ${response.status} for event ${event.id}`);
    }
    await outboxClient.outboxEvent!.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    log.debug("Outbox event dispatched", { eventId: event.id, eventType: event.eventType, aggregateId: event.aggregateId });
  };

  const tick = async () => {
    const events = await outboxClient.outboxEvent!.findMany({
      where: { processedAt: null },
      orderBy: { occurredAt: "asc" },
      take: 25
    });

    // Cada evento se despacha de forma independiente — un fallo no bloquea los demás
    for (const event of events) {
      try {
        await dispatchEvent(event);
      } catch (error) {
        log.error("Outbox dispatch failed; skipping event until next tick", {
          eventId: event.id,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }
  };

  const timer = setInterval(() => {
    tick().catch((error) => {
      // Error al leer la tabla outbox (p.ej. BD caída) — log y espera el siguiente tick
      log.error("Outbox processor tick failed", {
        error: error instanceof Error ? error : new Error(String(error))
      });
    });
  }, intervalMs);
  timer.unref();
}
