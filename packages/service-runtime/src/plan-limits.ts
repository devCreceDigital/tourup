import type { TenantId } from "@totem/shared-kernel";

export type PlanLimitResource = "trips" | "enrollments" | "documents" | "users";

export async function assertPlanLimit(input: {
  readonly tenantId: TenantId;
  readonly resource: PlanLimitResource;
  readonly currentCount: number;
  readonly requestedCount?: number;
}): Promise<void> {
  const baseUrl = process.env.SUBSCRIPTIONS_SERVICE_URL;
  if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
    if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") {
      throw new Error("SUBSCRIPTIONS_SERVICE_URL is required for plan limit enforcement.");
    }
    return;
  }
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/subscriptions/limits/check`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.SERVICE_INTERNAL_SECRET ? { "x-internal-service-secret": process.env.SERVICE_INTERNAL_SECRET } : {}),
      "x-internal-tenant-id": String(input.tenantId),
      "x-internal-user-role": "system"
    },
    body: JSON.stringify({
      tenantId: String(input.tenantId),
      resource: input.resource,
      currentCount: input.currentCount,
      requestedCount: input.requestedCount ?? 1
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Plan limit check failed: ${detail.slice(0, 240)}`);
  }
  const payload = await response.json() as { allowed?: boolean; reason?: string };
  if (payload.allowed === false) {
    throw new Error(payload.reason ?? "Plan limit exceeded.");
  }
}
