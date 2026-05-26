import type { IncomingHttpHeaders } from "node:http";

export function resolveTenantId(headers: IncomingHttpHeaders): string | null {
  const configuredSecret = process.env.SERVICE_INTERNAL_SECRET;
  const internalSecret = headers["x-internal-service-secret"];
  if (typeof configuredSecret !== "string" || configuredSecret.length === 0 || internalSecret !== configuredSecret) return null;

  const tenantId = headers["x-internal-tenant-id"];
  if (typeof tenantId === "string" && tenantId.length > 0) return tenantId;

  const businessId = headers["x-internal-business-id"];
  return typeof businessId === "string" && businessId.length > 0 ? businessId : null;
}

export function resolveBusinessId(headers: IncomingHttpHeaders): string | null {
  const configuredSecret = process.env.SERVICE_INTERNAL_SECRET;
  const internalSecret = headers["x-internal-service-secret"];
  if (typeof configuredSecret !== "string" || configuredSecret.length === 0 || internalSecret !== configuredSecret) return null;

  const businessId = headers["x-internal-business-id"];
  return typeof businessId === "string" && businessId.length > 0 ? businessId : resolveTenantId(headers);
}

export function resolveUserId(headers: IncomingHttpHeaders): string | null {
  const configuredSecret = process.env.SERVICE_INTERNAL_SECRET;
  const internalSecret = headers["x-internal-service-secret"];
  if (typeof configuredSecret !== "string" || configuredSecret.length === 0 || internalSecret !== configuredSecret) return null;

  const userId = headers["x-internal-user-id"];
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

export function resolveUserEmail(headers: IncomingHttpHeaders): string | null {
  const configuredSecret = process.env.SERVICE_INTERNAL_SECRET;
  const internalSecret = headers["x-internal-service-secret"];
  if (typeof configuredSecret !== "string" || configuredSecret.length === 0 || internalSecret !== configuredSecret) return null;

  const userEmail = headers["x-internal-user-email"];
  return typeof userEmail === "string" && userEmail.length > 0 ? userEmail : null;
}

export function defaultDemoTenantId(): string {
  const value = process.env.ASSISTANT_DEFAULT_TENANT_ID;
  if (typeof value === "string" && value.length > 0) return value;
  const appEnv = process.env.APP_ENV;
  const production = typeof appEnv === "string" && appEnv.length > 0 ? appEnv === "production" : process.env.NODE_ENV === "production";
  if (production) {
    throw new Error("ASSISTANT_DEFAULT_TENANT_ID is not allowed as an implicit production fallback.");
  }
  return "2dceea5b-1628-4261-b831-56af952b4348";
}
