import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Rutas protegidas y los roles que pueden acceder a ellas
// ─────────────────────────────────────────────────────────────────────────────
const PROTECTED: Record<string, readonly string[]> = {
  "/superadmin": ["superadmin"],
  "/admin":      ["admin", "superadmin"],
  "/viajero":    ["viajero", "admin", "superadmin"],
  "/onboarding": ["admin", "superadmin"],
};

// Destino por defecto según rol
const ROLE_HOME: Record<string, string> = {
  superadmin: "/superadmin",
  admin:      "/admin",
  viajero:    "/viajero",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers JWT (solo decodificación del payload — la validación real está en
// el API Gateway; aquí solo necesitamos el rol para enrutar)
// ─────────────────────────────────────────────────────────────────────────────
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const padded  = base64.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isExpired(payload: Record<string, unknown>): boolean {
  return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
}

function extractRole(payload: Record<string, unknown>): string {
  const app  = (payload.app_metadata  as Record<string, unknown> | undefined) ?? {};
  const user = (payload.user_metadata as Record<string, unknown> | undefined) ?? {};
  const raw  =
    app.role  ?? app.rol  ??
    user.role ?? user.rol ??
    payload.app_role ??
    "viajero";
  const role = typeof raw === "string" ? raw.trim() : "viajero";
  // normaliza alias legacy
  return role === "usuario" ? "viajero" : role;
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Busca si el path coincide con alguna ruta protegida
  const match = Object.entries(PROTECTED).find(([prefix]) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Si no es ruta protegida, pasa sin modificar
  if (!match) return NextResponse.next();

  const [, allowedRoles] = match;
  const token = request.cookies.get("totem_token")?.value;

  // Sin token → login
  if (!token) {
    return redirectToLogin(request, pathname);
  }

  const payload = decodePayload(token);

  // Token malformado → login + limpiar cookie
  if (!payload) {
    return redirectToLoginAndClear(request, pathname);
  }

  // Token expirado → login + limpiar cookie
  if (isExpired(payload)) {
    return redirectToLoginAndClear(request, pathname);
  }

  const role = extractRole(payload);

  // Rol no autorizado para esta sección → redirige a su home
  if (!allowedRoles.includes(role)) {
    const home = ROLE_HOME[role] ?? "/login";
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Todo OK — continúa
  return NextResponse.next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de redirección
// ─────────────────────────────────────────────────────────────────────────────
function redirectToLogin(request: NextRequest, from: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("redirect", from);
  return NextResponse.redirect(url);
}

function redirectToLoginAndClear(request: NextRequest, from: string): NextResponse {
  const response = redirectToLogin(request, from);
  response.cookies.set("totem_token", "", { maxAge: 0, path: "/" });
  return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// Matcher — solo intercepta las rutas que necesitan protección
// ─────────────────────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    "/admin/:path*",
    "/superadmin/:path*",
    "/viajero/:path*",
    "/onboarding/:path*",
  ],
};
