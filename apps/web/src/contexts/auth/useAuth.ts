"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./AuthContext";

/**
 * Hook principal para consumir el contexto de autenticación.
 *
 * Uso:
 * ```tsx
 * const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 * ```
 *
 * Debe usarse dentro de un componente envuelto por <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error(
      "useAuth debe usarse dentro de <AuthProvider>. " +
      "Asegúrate de que AuthProvider esté en el layout raíz."
    );
  }
  return ctx;
}

/**
 * Devuelve el usuario autenticado o lanza si no hay sesión activa.
 * Útil en componentes que solo se renderizan cuando hay sesión garantizada.
 */
export function useRequiredUser() {
  const { user, isLoading } = useAuth();
  if (!isLoading && user === null) {
    throw new Error("useRequiredUser: no hay usuario autenticado.");
  }
  return user;
}

/**
 * Devuelve true si el usuario tiene alguno de los roles indicados.
 *
 * ```tsx
 * const isAdmin = useHasRole("admin", "superadmin");
 * ```
 */
export function useHasRole(...roles: string[]): boolean {
  const { user } = useAuth();
  if (user === null) return false;
  const normalized = user.role === "usuario" ? "viajero" : user.role;
  return roles.includes(normalized);
}
