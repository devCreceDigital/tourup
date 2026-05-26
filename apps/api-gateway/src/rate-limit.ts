/**
 * Rate limiter para el API Gateway.
 *
 * Trabaja con la Web API `Request` (no con `IncomingMessage`).
 *
 * ── Backends ─────────────────────────────────────────────────────────────────
 * 1. InMemoryRateLimiterStorage  (default)
 *    Funciona out-of-the-box, pero el estado es local a cada proceso.
 *    Adecuado para desarrollo y despliegues de 1 instancia.
 *
 * 2. UpstashRateLimiterStorage  (recomendado para producción multi-instancia)
 *    Requiere UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN.
 *    Usa la REST API de Upstash con fetch — sin dependencia nueva.
 *    https://docs.upstash.com/redis/features/restapi
 *
 * El factory `createGatewayRateLimiter()` elige automáticamente según env vars.
 *
 * ── Límites configurables ────────────────────────────────────────────────────
 *   RATE_LIMIT_ANONYMOUS_RPM  = 60   req / min  por IP
 *   RATE_LIMIT_USER_RPM       = 300  req / min  por usuario
 *   RATE_LIMIT_USER_RPH       = 3000 req / hora por usuario
 */

// ─── Storage interface ────────────────────────────────────────────────────────

/**
 * Interfaz de almacenamiento para el rate limiter.
 * Implementa INCR + TTL sobre una clave.
 * Debe retornar el contador DESPUÉS del incremento.
 */
export interface RateLimiterStorage {
  /**
   * Incrementa el contador para `key` dentro de una ventana de `windowMs` ms.
   * Si la clave no existe, la crea con TTL = windowMs.
   * Retorna el valor del contador tras el incremento.
   */
  increment(key: string, windowMs: number): Promise<number>;
}

// ─── In-memory storage (default) ─────────────────────────────────────────────

type Bucket = { count: number; resetAt: number };

export class InMemoryRateLimiterStorage implements RateLimiterStorage {
  private readonly buckets = new Map<string, Bucket>();

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const current = this.buckets.get(key);
    if (current === undefined || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return 1;
    }
    current.count += 1;
    this.compact(now);
    return current.count;
  }

  private compact(now: number): void {
    if (this.buckets.size < 50_000) return;
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

// ─── Upstash REST storage (multi-instance production) ────────────────────────

/**
 * Rate limiter storage usando la REST API de Upstash Redis.
 * Requiere: UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN.
 *
 * Implementa el patrón:
 *   INCR key → count
 *   PEXPIRE key windowMs NX   (solo setea TTL si la clave es nueva)
 *
 * Documentación: https://upstash.com/docs/redis/features/restapi
 */
export class UpstashRateLimiterStorage implements RateLimiterStorage {
  constructor(
    private readonly restUrl: string,
    private readonly restToken: string
  ) {}

  async increment(key: string, windowMs: number): Promise<number> {
    // Usamos pipeline para INCR + PEXPIRE en una sola llamada HTTP
    const pipeline: [string, ...string[]][] = [
      ["INCR", key],
      ["PEXPIRE", key, String(windowMs), "NX"]
    ];

    const response = await fetch(`${this.restUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.restToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(pipeline)
    });

    if (!response.ok) {
      // Fallback seguro: no bloquear si Redis no responde
      return 0;
    }

    const results = await response.json() as Array<{ result: number }>;
    return results[0]?.result ?? 0;
  }
}

// ─── Rate limiter principal ───────────────────────────────────────────────────

type RuleDef = {
  readonly name: string;
  readonly maxRequests: number;
  readonly windowMs: number;
};

export class GatewayRateLimiter {
  private readonly rules: readonly RuleDef[];

  constructor(
    private readonly storage: RateLimiterStorage,
    rules?: readonly RuleDef[]
  ) {
    this.rules = rules ?? GatewayRateLimiter.defaultRules();
  }

  private static defaultRules(): readonly RuleDef[] {
    return [
      {
        name: "anonymous-burst",
        maxRequests: Number(process.env.RATE_LIMIT_ANONYMOUS_RPM ?? "60"),
        windowMs: 60_000
      },
      {
        name: "user-burst",
        maxRequests: Number(process.env.RATE_LIMIT_USER_RPM ?? "300"),
        windowMs: 60_000
      },
      {
        name: "user-sustained",
        maxRequests: Number(process.env.RATE_LIMIT_USER_RPH ?? "3000"),
        windowMs: 3_600_000
      }
    ];
  }

  /**
   * Comprueba si la petición supera alguno de los límites.
   * @throws Error con `.retryAfter` si el límite fue superado → 429
   */
  async assertAllowed(userId: string | null, clientIp: string): Promise<void> {
    const identity = userId ?? `ip:${clientIp}`;
    const applicableRules = userId === null
      ? this.rules.filter((r) => r.name.startsWith("anonymous"))
      : this.rules.filter((r) => r.name.startsWith("user"));

    for (const rule of applicableRules) {
      const key = `rl:${rule.name}:${identity}`;
      const count = await this.storage.increment(key, rule.windowMs);

      if (count > rule.maxRequests) {
        const retryAfterSec = Math.ceil(rule.windowMs / 1000);
        const err = Object.assign(
          new Error(`Too many requests. Retry after ${retryAfterSec}s.`),
          { retryAfter: retryAfterSec }
        );
        throw err;
      }
    }
  }
}

// ─── Factory: elige storage según env vars ────────────────────────────────────

/**
 * Crea un GatewayRateLimiter con el storage correcto:
 * - Si UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN están configurados → Upstash
 * - De lo contrario → in-memory (safe fallback)
 */
export function createGatewayRateLimiter(): GatewayRateLimiter {
  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (
    typeof upstashUrl   === "string" && upstashUrl.trim().length > 0 &&
    typeof upstashToken === "string" && upstashToken.trim().length > 0
  ) {
    return new GatewayRateLimiter(new UpstashRateLimiterStorage(upstashUrl.trim(), upstashToken.trim()));
  }

  return new GatewayRateLimiter(new InMemoryRateLimiterStorage());
}

/** Extrae la IP del cliente de los headers estándar de proxy */
export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded !== null && forwarded.trim().length > 0) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp !== null && realIp.trim().length > 0) return realIp.trim();
  return "unknown";
}
