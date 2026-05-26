/**
 * Health check con ping a la base de datos y backlog del outbox.
 *
 * Uso en main.ts de cada servicio:
 *   startHttpService("payments", routes, { healthCheck: createDbHealthCheck(prisma) });
 *
 * Respuesta en /health:
 *   { "status": "ok", "service": "payments", "db": "ok", "outboxBacklog": 0 }
 *   { "status": "degraded", "service": "payments", "db": "error", "outboxBacklog": 142 }
 */

type PingableClient = {
  readonly $queryRaw?: (query: TemplateStringsArray, ...values: readonly unknown[]) => Promise<unknown>;
};

type OutboxCountClient = {
  readonly outboxEvent?: {
    readonly count: (args: { where: Record<string, unknown> }) => Promise<number>;
  };
};

function asPingable(client: unknown): PingableClient {
  return typeof client === "object" && client !== null ? client as PingableClient : {};
}

function asOutboxCountable(client: unknown): OutboxCountClient {
  return typeof client === "object" && client !== null ? client as OutboxCountClient : {};
}

export type HealthStatus = {
  readonly db: "ok" | "error";
  readonly outboxBacklog: number | null;
  readonly outboxDead: number | null;
};

/**
 * Crea un callback de health check que:
 * 1. Hace un ping a la base de datos (SELECT 1)
 * 2. Cuenta los eventos del outbox sin procesar
 * 3. Cuenta los eventos "dead" (agotaron sus reintentos)
 *
 * Compatible con `startHttpService` options.healthCheck.
 */
export function createDbHealthCheck(client: unknown): () => Promise<Record<string, unknown>> {
  const pingable    = asPingable(client);
  const countable   = asOutboxCountable(client);

  return async () => {
    // ── 1. Ping DB ─────────────────────────────────────────────────────────
    let db: "ok" | "error" = "ok";
    if (typeof pingable.$queryRaw === "function") {
      try {
        await pingable.$queryRaw`SELECT 1`;
      } catch {
        db = "error";
      }
    }

    // ── 2. Outbox backlog ───────────────────────────────────────────────────
    let outboxBacklog: number | null = null;
    let outboxDead: number | null = null;

    if (countable.outboxEvent !== undefined) {
      const maxRetries = Number(process.env.OUTBOX_MAX_RETRIES ?? "5");
      try {
        [outboxBacklog, outboxDead] = await Promise.all([
          countable.outboxEvent.count({
            where: { processedAt: null, retryCount: { lt: maxRetries } }
          }),
          countable.outboxEvent.count({
            where: { processedAt: null, retryCount: { gte: maxRetries } }
          })
        ]);
      } catch {
        // No bloquear el health check si el outbox falla
      }
    }

    const status = db === "error" ? "degraded" : "ok";
    return {
      status,
      db,
      ...(outboxBacklog !== null ? { outboxBacklog } : {}),
      ...(outboxDead !== null && outboxDead > 0 ? { outboxDead } : {})
    };
  };
}
