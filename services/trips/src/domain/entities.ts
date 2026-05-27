import type { EntityId, TenantId } from "@totem/shared-kernel";
import { TripInvariantViolation } from "./errors.js";

export type TripStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type TripSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: TripStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class Trip {
  private constructor(private readonly state: TripSnapshot) {}

  static create(input: Omit<TripSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): Trip {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new TripInvariantViolation("A new trip cannot start in a terminal state.");
    }
    return new Trip({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: TripSnapshot): Trip {
    return new Trip(snapshot);
  }

  changeStatus(status: TripStatus, now: string): Trip {
    if (this.state.status === "archived" && status !== "archived") {
      throw new TripInvariantViolation("Archived trip cannot be reactivated without a dedicated restoration use case.");
    }
    return new Trip({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): Trip {
    return new Trip({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): TripSnapshot {
    return this.state;
  }
}
