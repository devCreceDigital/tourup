const warnedMessages = new Set<string>();

function warnOnce(message: string): void {
  if (warnedMessages.has(message)) return;
  warnedMessages.add(message);
  console.warn(message);
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function shouldUseMockApi(): boolean {
  if (isProductionRuntime() && process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    throw new Error("NEXT_PUBLIC_USE_MOCK_API cannot be true in production.");
  }
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
}

export function getApiBaseUrl(): string {
  const gateway = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (gateway) {
    return gateway;
  }

  const fallback = "http://localhost:4100";

  if (!isProductionRuntime()) {
    warnOnce(`[Env] NEXT_PUBLIC_API_BASE_URL no definida. Fallback API: ${fallback}`);
    return fallback;
  }

  if (typeof window === "undefined") {
    return fallback;
  }

  throw new Error("Falta NEXT_PUBLIC_API_BASE_URL.");
}

export function getAssistantApiBaseUrl(): string {
  const gateway = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (gateway) {
    return `${gateway}/assistant`;
  }
  if (!isProductionRuntime()) return "http://localhost:4100/assistant";
  throw new Error("Falta NEXT_PUBLIC_API_BASE_URL para assistant.");
}
