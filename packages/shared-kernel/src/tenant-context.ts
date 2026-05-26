import type { TenantId, UserId } from "./ids.js";
import { ForbiddenError, UnauthorizedError } from "./errors.js";

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

/**
 * Requiere que el contexto tenga un tenantId.
 * Lanza 401 si el usuario no está autenticado (no tiene tenant).
 */
export function requireTenant(context: TenantContext): TenantId {
  if (context.tenantId === null) {
    throw new UnauthorizedError("Authentication required to access this resource.");
  }
  return context.tenantId;
}

/**
 * Requiere rol admin o superadmin.
 * Lanza 403 si el rol no es suficiente.
 */
export function assertAdmin(context: TenantContext): void {
  if (context.role !== "admin" && context.role !== "superadmin") {
    throw new ForbiddenError("Admin role is required.");
  }
}

/**
 * Restringe el tenantId al scope del contexto autenticado.
 * Superadmin puede operar sobre cualquier tenant.
 */
export function tenantScope(context: TenantContext, requestedTenantId: TenantId | null | undefined): TenantId | null {
  if (context.role === "superadmin") {
    return requestedTenantId ?? null;
  }

  const tenantId = requireTenant(context);
  if (requestedTenantId !== undefined && requestedTenantId !== null && requestedTenantId !== tenantId) {
    throw new ForbiddenError("Tenant scope mismatch.");
  }
  return tenantId;
}

export function assertTenantScope(context: TenantContext, requestedTenantId: TenantId | null | undefined): TenantId | null {
  return tenantScope(context, requestedTenantId);
}
