"use client";

import { getAssistantApiBaseUrl } from "@/shared/config/env";

function normalizeEndpoint(endpoint: string): string {
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

export function assistantUrl(endpoint: string): string {
  const base = getAssistantApiBaseUrl().replace(/\/+$/, "");
  return `${base}${normalizeEndpoint(endpoint)}`;
}

export async function fetchAssistant(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("content-type") && options.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  const token = typeof window === "undefined" ? null : localStorage.getItem("totem_token");
  if (token !== null && token.length > 0) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return fetch(assistantUrl(endpoint), {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });
}
