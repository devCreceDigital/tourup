import type { EntityId, TenantId } from "@totem/shared-kernel";
import { TenantInvariantViolation } from "./errors.js";

export type TenantStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type TenantSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: TenantStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class Tenant {
  private constructor(private readonly state: TenantSnapshot) {}

  static create(input: Omit<TenantSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): Tenant {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new TenantInvariantViolation("A new tenant cannot start in a terminal state.");
    }
    return new Tenant({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: TenantSnapshot): Tenant {
    return new Tenant(snapshot);
  }

  changeStatus(status: TenantStatus, now: string): Tenant {
    if (this.state.status === "archived" && status !== "archived") {
      throw new TenantInvariantViolation("Archived tenant cannot be reactivated without a dedicated restoration use case.");
    }
    return new Tenant({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): Tenant {
    return new Tenant({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): TenantSnapshot {
    return this.state;
  }
}
