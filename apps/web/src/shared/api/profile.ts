"use client";

import { requestTotemApi } from "@/shared/api/totem-api-client";

export type TotemProfile = {
  readonly id: string;
  readonly tenantId: string | null;
  readonly email: string;
  readonly name: string;
  readonly role: "superadmin" | "admin" | "viajero" | string;
  readonly isActive?: boolean;
};

type ProfilePayload = {
  readonly id?: unknown;
  readonly tenantId?: unknown;
  readonly tenant_id?: unknown;
  readonly email?: unknown;
  readonly name?: unknown;
  readonly nombre?: unknown;
  readonly role?: unknown;
  readonly rol?: unknown;
  readonly isActive?: unknown;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizeTotemProfile(payload: unknown): TotemProfile {
  const body = (typeof payload === "object" && payload !== null && !Array.isArray(payload) ? payload : {}) as ProfilePayload;
  const profile: TotemProfile = {
    id: asText(body.id),
    tenantId: asNullableText(body.tenantId ?? body.tenant_id),
    email: asText(body.email),
    name: asText(body.name ?? body.nombre),
    role: asText(body.role ?? body.rol) || "viajero",
  };
  return typeof body.isActive === "boolean" ? { ...profile, isActive: body.isActive } : profile;
}

export async function getCurrentProfile(): Promise<TotemProfile | null> {
  const response = await requestTotemApi("/identity/profile/me");
  if (!response.ok) return null;
  return normalizeTotemProfile(await response.json());
}

export function persistProfileSession(profile: TotemProfile): void {
  localStorage.setItem("totem_rol", profile.role === "viajero" ? "usuario" : profile.role);
  localStorage.setItem("totem_nombre", profile.name);
  localStorage.setItem("totem_email", profile.email);
  if (profile.tenantId !== null) {
    localStorage.setItem("totem_tenant_id", profile.tenantId);
  } else {
    localStorage.removeItem("totem_tenant_id");
  }
}

export function clearProfileSession(): void {
  for (const key of [
    "totem_token",
    "totem_rol",
    "totem_nombre",
    "totem_email",
    "totem_tenant_id",
    "totem_nombre_agencia",
    "totem_user"
  ]) {
    localStorage.removeItem(key);
  }
  document.cookie = "totem_token=; path=/; max-age=0; SameSite=Lax";
}
