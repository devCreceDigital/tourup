"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearProfileSession,
  getCurrentProfile,
  normalizeTotemProfile,
  persistProfileSession,
  type TotemProfile,
} from "@/shared/api/profile";
import { requestTotemApi } from "@/shared/api/totem-api-client";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
export type AuthRole = "superadmin" | "admin" | "viajero" | string;

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: TotemProfile };

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: "viajero" | "admin";
}

export interface AuthContextValue {
  /** Estado completo de autenticación */
  state: AuthState;
  /** true mientras se verifica la sesión inicial */
  isLoading: boolean;
  /** true cuando hay un usuario autenticado */
  isAuthenticated: boolean;
  /** Perfil del usuario o null */
  user: TotemProfile | null;
  /** Inicia sesión y devuelve el perfil obtenido */
  login: (credentials: LoginCredentials) => Promise<TotemProfile>;
  /** Registra una cuenta nueva y devuelve el perfil */
  register: (payload: RegisterPayload) => Promise<TotemProfile>;
  /** Cierra sesión y redirige a /login */
  logout: () => Promise<void>;
  /** Refresca el perfil desde el backend */
  refreshProfile: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexto
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const initialized = useRef(false);

  // ── Inicialización: verifica sesión al montar ──────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = typeof window !== "undefined"
      ? localStorage.getItem("totem_token")
      : null;

    if (!token) {
      setState({ status: "unauthenticated" });
      return;
    }

    getCurrentProfile()
      .then((profile) => {
        if (profile === null) {
          clearProfileSession();
          setState({ status: "unauthenticated" });
        } else {
          persistProfileSession(profile);
          setState({ status: "authenticated", user: profile });
        }
      })
      .catch(() => {
        setState({ status: "unauthenticated" });
      });
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginCredentials): Promise<TotemProfile> => {
    const response = await requestTotemApi("/identity/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    type LoginResponse = {
      access_token?: string;
      user?: unknown;
      error?: { message?: string };
    };
    const data = (await response.json()) as LoginResponse;

    if (!response.ok || typeof data.access_token !== "string" || data.user === undefined) {
      throw new Error(data.error?.message ?? "Credenciales incorrectas.");
    }

    const profile = normalizeTotemProfile(data.user);

    // Persiste token
    localStorage.setItem("totem_token", data.access_token);
    document.cookie = `totem_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
    persistProfileSession(profile);

    setState({ status: "authenticated", user: profile });
    return profile;
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (payload: RegisterPayload): Promise<TotemProfile> => {
    const response = await requestTotemApi("/identity/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    type RegisterResponse = {
      access_token?: string;
      user?: unknown;
      error?: { message?: string };
    };
    const data = (await response.json()) as RegisterResponse;

    if (!response.ok || typeof data.access_token !== "string" || data.user === undefined) {
      throw new Error(data.error?.message ?? "No se pudo crear la cuenta.");
    }

    const profile = normalizeTotemProfile(data.user);

    localStorage.setItem("totem_token", data.access_token);
    document.cookie = `totem_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
    persistProfileSession(profile);

    setState({ status: "authenticated", user: profile });
    return profile;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    clearProfileSession();
    setState({ status: "unauthenticated" });
    router.push("/login");
    router.refresh();
  }, [router]);

  // ── Refresh profile ────────────────────────────────────────────────────────
  const refreshProfile = useCallback(async (): Promise<void> => {
    const profile = await getCurrentProfile();
    if (profile === null) {
      clearProfileSession();
      setState({ status: "unauthenticated" });
      return;
    }
    persistProfileSession(profile);
    setState({ status: "authenticated", user: profile });
  }, []);

  // ── Valor del contexto ─────────────────────────────────────────────────────
  const value = useMemo<AuthContextValue>(() => ({
    state,
    isLoading:       state.status === "loading",
    isAuthenticated: state.status === "authenticated",
    user:            state.status === "authenticated" ? state.user : null,
    login,
    register,
    logout,
    refreshProfile,
  }), [state, login, register, logout, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exporta el contexto para useAuth
// ─────────────────────────────────────────────────────────────────────────────
export { AuthContext };
