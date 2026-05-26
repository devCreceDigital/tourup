import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { ProfileStatus } from "../domain/entities.js";

export type CreateProfileCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: ProfileStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateProfileCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeProfileStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: ProfileStatus;
};

export type IdentityCommandName =
  | "CreateProfile"
  | "UpdateProfileRole"
  | "CreateInvitation"
  | "AcceptInvitation";
