const warnedMessages = new Set<string>();

function warnOnce(message: string): void {
  if (warnedMessages.has(message)) return;
  warnedMessages.add(message);
  console.warn(message);
}

function getRequiredPublicEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable publica ${name}.`);
  }
  return value;
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function shouldUseMockApi(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
}

export function getApiBaseUrl(): string {
  const rawValue = process.env.NEXT_PUBLIC_DJANGO_API_URL;

  if (rawValue) {
    const base = rawValue.replace(/\/+$/, "");
    return base.endsWith("/api") ? base : `${base}/api`;
  }

  const fallback = "http://164.152.21.112/api";
  
  // 1. Si no está en producción (local), avisa y usa el fallback
  if (!isProductionRuntime()) {
    warnOnce(
      `[Env] NEXT_PUBLIC_DJANGO_API_URL no esta definida. Se usa fallback ${fallback}.`
    );
    return fallback;
  }

  // 2. NUEVO: Si está en producción pero es la fase de BUILD (servidor de Docker compilando),
  // devolvemos el fallback temporalmente para que Next.js pueda terminar de compilar.
  if (typeof window === "undefined") {
    return fallback; 
  }

  // 3. Si ya está corriendo en el navegador del usuario real en producción y sigue sin existir, ahí sí explota.
  throw new Error("Falta la variable publica NEXT_PUBLIC_DJANGO_API_URL.");
}

export function getSupabasePublicEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    return { url, anonKey };
  }

  if (isProductionRuntime()) {
    return {
      url: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
      anonKey: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    };
  }

  warnOnce(
    "[Env] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "La autenticacion con Supabase quedara deshabilitada hasta configurarlas."
  );
  return null;
}
