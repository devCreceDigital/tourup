"use client";

import { getApiBaseUrl } from "@/shared/config/env";

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export async function requestTotemApi(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("content-type") && options.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  const token = typeof window === "undefined" ? null : localStorage.getItem("totem_token");
  if (token !== null && token.length > 0) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return fetch(`${getApiBaseUrl()}${normalizePath(path)}`, {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });
}

export async function readTotemJson<T>(response: Response): Promise<T> {
  const payload = await response.json() as unknown;
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "error" in payload
      ? JSON.stringify(payload)
      : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}
