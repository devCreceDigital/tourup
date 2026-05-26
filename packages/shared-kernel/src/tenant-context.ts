import type { TenantId, UserId } from "./ids.js";

export type Role = "superadmin" | "admin" | "viajero" | "system" | "anonymous";

export type TenantContext = {
  readonly tenantId: TenantId | null;
  readonly businessId: TenantId | null;
  readonly userId: UserId | null;
  readonly userEmail: string | null;
  readonly role: Role;
  readonly requestId: string;
  readonly isPublic: boolean;
};

export function requireTenant(context: TenantContext): TenantId {
  if (context.tenantId === null) {
    throw new Error("Tenant context is required.");
  }
  return context.tenantId;
}

export function assertAdmin(context: TenantContext): void {
  if (context.role !== "admin" && context.role !== "superadmin") {
    throw new Error("Admin role is required.");
  }
}

export function tenantScope(context: TenantContext, requestedTenantId: TenantId | null | undefined): TenantId | null {
  if (context.role === "superadmin") {
    return requestedTenantId ?? null;
  }

  const tenantId = requireTenant(context);
  if (requestedTenantId !== undefined && requestedTenantId !== null && requestedTenantId !== tenantId) {
    throw new Error("Tenant scope mismatch.");
  }
  return tenantId;
}

export function assertTenantScope(context: TenantContext, requestedTenantId: TenantId | null | undefined): TenantId | null {
  return tenantScope(context, requestedTenantId);
}
