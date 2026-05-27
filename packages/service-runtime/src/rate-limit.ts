import type { IncomingMessage } from "node:http";

type RateLimitRule = {
  readonly name: string;
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly identity: (request: IncomingMessage) => string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

function headerValue(request: IncomingMessage, name: string): string | null {
  const value = request.headers[name.toLowerCase()];
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}

function remoteAddress(request: IncomingMessage): string {
  const forwarded = headerValue(request, "x-forwarded-for");
  if (forwarded !== null) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.socket.remoteAddress ?? "unknown";
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly rules: readonly RateLimitRule[]) {}

  assertAllowed(request: IncomingMessage): void {
    const now = Date.now();
    for (const rule of this.rules) {
      const key = `${rule.name}:${rule.identity(request)}`;
      const current = this.buckets.get(key);
      if (current === undefined || current.resetAt <= now) {
        this.buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
        continue;
      }
      if (current.count >= rule.maxRequests) {
        throw new Error(`Rate limit exceeded: ${rule.name}.`);
      }
      current.count += 1;
    }
    this.compact(now);
  }

  private compact(now: number): void {
    if (this.buckets.size < 10_000) return;
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

export function defaultRateLimiter(): InMemoryRateLimiter {
  return new InMemoryRateLimiter([
    {
      name: "anonymous-burst",
      maxRequests: 100,
      windowMs: 60_000,
      identity: (request) => headerValue(request, "x-user-id") ?? remoteAddress(request)
    },
    {
      name: "authenticated-burst",
      maxRequests: 60,
      windowMs: 60_000,
      identity: (request) => headerValue(request, "x-user-id") ?? remoteAddress(request)
    },
    {
      name: "sustained",
      maxRequests: 1_000,
      windowMs: 3_600_000,
      identity: (request) => headerValue(request, "x-user-id") ?? remoteAddress(request)
    }
  ]);
}
