import type { User } from "@supabase/supabase-js";

/**
 * Roles del sistema Totem HUB (multi-tenant SaaS).
 *
 * Jerarquía:
 *   superadmin → ve todos los tenants (panel /superadmin)
 *   admin      → ve su tenant completo (panel /admin)
 *   viajero    → ve solo sus datos personales (portal /viajero)
 *
 * El rol vive en app_metadata.rol (gestionado por backend, seguro)
 * con fallback a user_metadata.rol (modificable por el usuario, solo
 * para el momento del registro antes de que el backend lo promueva).
 *
 * Principio de menor privilegio: si no hay rol, asumimos "viajero".
 */

export type AppRole = "superadmin" | "admin" | "viajero";

const ROLES_VALIDOS: AppRole[] = ["superadmin", "admin", "viajero"];

export function resolveRoleFromUser(user: User | null | undefined): AppRole | null {
  if (!user) return null;

  const appMetaRole = user.app_metadata?.rol;
  if (typeof appMetaRole === "string" && isValidRole(appMetaRole)) {
    return appMetaRole;
  }

  const userMetaRole = user.user_metadata?.rol;
  if (typeof userMetaRole === "string" && isValidRole(userMetaRole)) {
    return userMetaRole;
  }

  return "viajero";
}

export function isValidRole(value: string): value is AppRole {
  return ROLES_VALIDOS.includes(value as AppRole);
}

export function isSuperAdmin(user: User | null | undefined): boolean {
  return resolveRoleFromUser(user) === "superadmin";
}

export function isAdmin(user: User | null | undefined): boolean {
  return resolveRoleFromUser(user) === "admin";
}

export function isAdminOrSuperAdmin(user: User | null | undefined): boolean {
  const rol = resolveRoleFromUser(user);
  return rol === "admin" || rol === "superadmin";
}

export function isViajero(user: User | null | undefined): boolean {
  return resolveRoleFromUser(user) === "viajero";
}

export function getDashboardPath(user: User | null | undefined): string {
  const rol = resolveRoleFromUser(user);
  if (rol === "superadmin") return "/superadmin";
  if (rol === "admin") return "/admin";
  return "/viajero";
}
