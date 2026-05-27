import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  // Rutas publicas: no requieren autenticacion ni sesion Supabase.
  const publicPaths = ["/asistente-ia"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return supabaseResponse;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // No agregar logica entre createServerClient y getUser():
  // Supabase puede refrescar la sesion en este punto.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role: string = user?.app_metadata?.rol ?? user?.user_metadata?.rol ?? "viajero";

  if (pathname.startsWith("/superadmin")) {
    if (!user) {
      return redirectTo(request, "/login", pathname);
    }
    if (role !== "superadmin") {
      return redirectTo(request, role === "admin" ? "/admin" : "/viajero");
    }
    return supabaseResponse;
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return redirectTo(request, "/login", pathname);
    }
    if (role !== "admin" && role !== "superadmin") {
      return redirectTo(request, "/viajero");
    }
    return supabaseResponse;
  }

  if (pathname.startsWith("/viajero")) {
    if (!user) {
      return redirectTo(request, "/login", pathname);
    }
    return supabaseResponse;
  }

  if (pathname.startsWith("/onboarding")) {
    if (!user) {
      return redirectTo(request, "/login");
    }
    if (role !== "admin" && role !== "superadmin") {
      return redirectTo(request, "/viajero");
    }
    return supabaseResponse;
  }

  if (pathname === "/login" || pathname === "/registro") {
    if (user) {
      if (role === "superadmin") return redirectTo(request, "/superadmin");
      if (role === "admin") return redirectTo(request, "/admin");
      return redirectTo(request, "/viajero");
    }
  }

  return supabaseResponse;
}

function redirectTo(request: NextRequest, destination: string, from?: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = destination;
  url.search = "";
  if (from) {
    url.searchParams.set("redirect", from);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
