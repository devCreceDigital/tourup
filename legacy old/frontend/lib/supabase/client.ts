"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para usar en CLIENT Components.
 *
 * Usa "use client" porque manipula cookies del browser (auth tokens).
 * NO usar este cliente en Server Components — usar el de server.ts.
 *
 * Pattern: singleton lazy.
 *   - Solo se crea UNA instancia por sesion del browser.
 *   - Si las variables de entorno no estan definidas, devuelve null
 *     (no rompe la app, permite mostrar mensajes de error claros).
 */

let cachedClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient | null {
  // Evitar recrear el cliente en cada llamada
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Guardarrieles: si faltan vars, log y devolver null
  if (!url || !anonKey) {
    if (typeof window !== "undefined") {
      console.warn(
        "[Supabase] Faltan variables NEXT_PUBLIC_SUPABASE_URL o " +
          "NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local. " +
          "El cliente Supabase no se inicializo."
      );
    }
    return null;
  }

  cachedClient = createBrowserClient(url, anonKey);
  return cachedClient;
}