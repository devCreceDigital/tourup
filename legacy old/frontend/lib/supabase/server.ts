import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para usar en SERVER Components y Route Handlers.
 *
 * Diferencia con client.ts:
 *   - Lee/escribe cookies via next/headers (no del browser).
 *   - Necesita ser async porque next/headers cookies() es async en Next 15+.
 *   - NO se cachea (cada request crea su propio cliente con sus cookies).
 *
 * Uso tipico:
 *   - Server Components que necesitan saber si hay user logueado
 *   - Route Handlers (app/api/...) que ejecutan queries con auth
 *   - middleware.ts (con variante separada, ver mas abajo)
 *
 * IMPORTANTE: NO usar este cliente en Client Components — usar el de client.ts.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn(
      "[Supabase Server] Faltan variables NEXT_PUBLIC_SUPABASE_URL o " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local."
    );
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll() puede fallar si se llama desde un Server Component puro
          // (sin Route Handler). En ese caso, ignoramos el error porque el
          // middleware se encargara de refrescar la sesion.
        }
      },
    },
  });
}