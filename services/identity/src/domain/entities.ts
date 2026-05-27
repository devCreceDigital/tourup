import type { EntityId, TenantId } from "@totem/shared-kernel";
import { ProfileInvariantViolation } from "./errors.js";

export type ProfileStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type ProfileSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: ProfileStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class Profile {
  private constructor(private readonly state: ProfileSnapshot) {}

  static create(input: Omit<ProfileSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): Profile {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new ProfileInvariantViolation("A new profile cannot start in a terminal state.");
    }
    return new Profile({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: ProfileSnapshot): Profile {
    return new Profile(snapshot);
  }

  changeStatus(status: ProfileStatus, now: string): Profile {
    if (this.state.status === "archived" && status !== "archived") {
      throw new ProfileInvariantViolation("Archived profile cannot be reactivated without a dedicated restoration use case.");
    }
    return new Profile({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): Profile {
    return new Profile({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): ProfileSnapshot {
    return this.state;
  }
}
