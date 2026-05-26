import type { EntityId } from "@totem/shared-kernel";

export type TenantStatus = "activo" | "cancelado" | "suspendido";

export type TenantPreferences = {
  readonly logoUrl: string | null;
  readonly bannerUrl: string | null;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly description: string;
  readonly website: string;
  readonly phone: string;
  readonly ruc: string;
  readonly slogan: string;
  readonly customDomain: string | null;
  readonly socialLinks: Record<string, unknown>;
  readonly preferences: Record<string, unknown>;
  readonly onboardingStep: number;
  readonly onboardingCompleted: boolean;
};

export type Tenant = {
  readonly id: EntityId;
  readonly name: string;
  readonly domain: string;
  readonly planId: EntityId | null;
  readonly status: TenantStatus;
  readonly preferences: TenantPreferences;
};

export function assertActiveTenant(tenant: Tenant): void {
  if (tenant.status !== "activo") {
    throw new Error("Tenant is not active.");
  }
}
