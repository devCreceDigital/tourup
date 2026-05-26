import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertProfileCanAccessTenant, type Profile, type UserInvitation } from "../domain/profile.js";

export interface ProfileRepository {
  findByEmail(email: string): Promise<Profile | null>;
  findById(id: EntityId): Promise<Profile | null>;
  saveProfile(profile: Profile, idempotencyKey?: IdempotencyKey): Promise<void>;
  saveInvitation(invitation: UserInvitation, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class GetProfileByEmail {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(email: string, context: TenantContext): Promise<Profile> {
    const profile = await this.profiles.findByEmail(email);
    if (profile === null) throw new Error("Profile not found.");
    if (context.role !== "superadmin" && context.tenantId !== null) assertProfileCanAccessTenant(profile, context.tenantId);
    return profile;
  }
}

export class InviteUser {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(invitation: UserInvitation, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<UserInvitation> {
    assertAdmin(context);
    const tenantId: TenantId = requireTenant(context);
    const owned = { ...invitation, tenantId, status: "pendiente" as const };
    await this.profiles.saveInvitation(owned, idempotencyKey);
    return owned;
  }
}
