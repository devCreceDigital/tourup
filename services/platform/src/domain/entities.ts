import type { EntityId, TenantId } from "@totem/shared-kernel";
import { PlatformTenantViewInvariantViolation } from "./errors.js";

export type PlatformTenantViewStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type PlatformTenantViewSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: PlatformTenantViewStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class PlatformTenantView {
  private constructor(private readonly state: PlatformTenantViewSnapshot) {}

  static create(input: Omit<PlatformTenantViewSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): PlatformTenantView {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new PlatformTenantViewInvariantViolation("A new platform tenant view cannot start in a terminal state.");
    }
    return new PlatformTenantView({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: PlatformTenantViewSnapshot): PlatformTenantView {
    return new PlatformTenantView(snapshot);
  }

  changeStatus(status: PlatformTenantViewStatus, now: string): PlatformTenantView {
    if (this.state.status === "archived" && status !== "archived") {
      throw new PlatformTenantViewInvariantViolation("Archived platform tenant view cannot be reactivated without a dedicated restoration use case.");
    }
    return new PlatformTenantView({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): PlatformTenantView {
    return new PlatformTenantView({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): PlatformTenantViewSnapshot {
    return this.state;
  }
}
