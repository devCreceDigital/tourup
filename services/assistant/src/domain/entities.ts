import type { EntityId, TenantId } from "@totem/shared-kernel";
import { AssistantSessionInvariantViolation } from "./errors.js";

export type AssistantSessionStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type AssistantSessionSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: AssistantSessionStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class AssistantSession {
  private constructor(private readonly state: AssistantSessionSnapshot) {}

  static create(input: Omit<AssistantSessionSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): AssistantSession {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new AssistantSessionInvariantViolation("A new assistant session cannot start in a terminal state.");
    }
    return new AssistantSession({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: AssistantSessionSnapshot): AssistantSession {
    return new AssistantSession(snapshot);
  }

  changeStatus(status: AssistantSessionStatus, now: string): AssistantSession {
    if (this.state.status === "archived" && status !== "archived") {
      throw new AssistantSessionInvariantViolation("Archived assistant session cannot be reactivated without a dedicated restoration use case.");
    }
    return new AssistantSession({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): AssistantSession {
    return new AssistantSession({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): AssistantSessionSnapshot {
    return this.state;
  }
}
