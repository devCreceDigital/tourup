/**
 * Rate limiter para el API Gateway.
 *
 * Trabaja con la Web API `Request` (no con `IncomingMessage`).
 * Clave de identidad:
 *   - userId    → para peticiones autenticadas
 *   - IP        → para peticiones anónimas
 *
 * Límites predeterminados (configurables por env):
 *   RATE_LIMIT_ANONYMOUS_RPS  = 60  req / min  por IP
 *   RATE_LIMIT_USER_RPM       = 300 req / min  por usuario
 *   RATE_LIMIT_USER_RPH       = 3000 req / hora por usuario
 *
 * En prod, reemplazar por Redis-backed limiter cuando haya varias instancias.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

type RuleDef = {
  readonly name: string;
  readonly maxRequests: number;
  readonly windowMs: number;
};

export class GatewayRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly rules: readonly RuleDef[];

  constructor(rules?: readonly RuleDef[]) {
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
   * @param userId  null → petición anónima, usa IP como clave
   * @param clientIp  IP del cliente (ya normalizada)
   * @throws Error si el límite fue superado (capturar en main.ts → 429)
   */
  assertAllowed(userId: string | null, clientIp: string): void {
    const now = Date.now();
    const identity = userId ?? `ip:${clientIp}`;
    const applicableRules = userId === null
      ? this.rules.filter((r) => r.name.startsWith("anonymous"))
      : this.rules.filter((r) => r.name.startsWith("user"));

    for (const rule of applicableRules) {
      const key = `${rule.name}:${identity}`;
      const current = this.buckets.get(key);

      if (current === undefined || current.resetAt <= now) {
        this.buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
        continue;
      }
      if (current.count >= rule.maxRequests) {
        const retryAfterSec = Math.ceil((current.resetAt - now) / 1000);
        const err = Object.assign(
          new Error(`Too many requests. Retry after ${retryAfterSec}s.`),
          { retryAfter: retryAfterSec }
        );
        throw err;
      }
      current.count += 1;
    }
    this.compact(now);
  }

  private compact(now: number): void {
    if (this.buckets.size < 50_000) return;
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
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
