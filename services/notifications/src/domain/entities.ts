import type { EntityId, TenantId } from "@totem/shared-kernel";
import { NotificationInvariantViolation } from "./errors.js";

export type NotificationStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type NotificationSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: NotificationStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class Notification {
  private constructor(private readonly state: NotificationSnapshot) {}

  static create(input: Omit<NotificationSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): Notification {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new NotificationInvariantViolation("A new notification cannot start in a terminal state.");
    }
    return new Notification({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: NotificationSnapshot): Notification {
    return new Notification(snapshot);
  }

  changeStatus(status: NotificationStatus, now: string): Notification {
    if (this.state.status === "archived" && status !== "archived") {
      throw new NotificationInvariantViolation("Archived notification cannot be reactivated without a dedicated restoration use case.");
    }
    return new Notification({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): Notification {
    return new Notification({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): NotificationSnapshot {
    return this.state;
  }
}
