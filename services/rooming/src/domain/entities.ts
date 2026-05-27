import type { EntityId, TenantId } from "@totem/shared-kernel";
import { RoomingPlanInvariantViolation } from "./errors.js";

export type RoomingPlanStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type RoomingPlanSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: RoomingPlanStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class RoomingPlan {
  private constructor(private readonly state: RoomingPlanSnapshot) {}

  static create(input: Omit<RoomingPlanSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): RoomingPlan {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new RoomingPlanInvariantViolation("A new rooming plan cannot start in a terminal state.");
    }
    return new RoomingPlan({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: RoomingPlanSnapshot): RoomingPlan {
    return new RoomingPlan(snapshot);
  }

  changeStatus(status: RoomingPlanStatus, now: string): RoomingPlan {
    if (this.state.status === "archived" && status !== "archived") {
      throw new RoomingPlanInvariantViolation("Archived rooming plan cannot be reactivated without a dedicated restoration use case.");
    }
    return new RoomingPlan({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): RoomingPlan {
    return new RoomingPlan({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): RoomingPlanSnapshot {
    return this.state;
  }
}
