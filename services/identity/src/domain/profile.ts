import type { EntityId, TenantId } from "@totem/shared-kernel";

export type ProfileRole = "superadmin" | "admin" | "viajero";

export type Profile = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly email: string;
  readonly name: string;
  readonly role: ProfileRole;
  readonly isActive: boolean;
};

export type UserInvitation = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly email: string;
  readonly role: Exclude<ProfileRole, "superadmin">;
  readonly tokenHash: string;
  readonly status: "pendiente" | "aceptada" | "expirada";
  readonly expiresAt: string;
};

export function assertProfileCanAccessTenant(profile: Profile, tenantId: TenantId): void {
  if (profile.role !== "superadmin" && profile.tenantId !== tenantId) {
    throw new Error("Profile cannot access this tenant.");
  }
}
