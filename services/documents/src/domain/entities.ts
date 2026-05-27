import type { EntityId, TenantId } from "@totem/shared-kernel";
import { TravelerDocumentInvariantViolation } from "./errors.js";

export type TravelerDocumentStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type TravelerDocumentSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: TravelerDocumentStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class TravelerDocument {
  private constructor(private readonly state: TravelerDocumentSnapshot) {}

  static create(input: Omit<TravelerDocumentSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): TravelerDocument {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new TravelerDocumentInvariantViolation("A new traveler document cannot start in a terminal state.");
    }
    return new TravelerDocument({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: TravelerDocumentSnapshot): TravelerDocument {
    return new TravelerDocument(snapshot);
  }

  changeStatus(status: TravelerDocumentStatus, now: string): TravelerDocument {
    if (this.state.status === "archived" && status !== "archived") {
      throw new TravelerDocumentInvariantViolation("Archived traveler document cannot be reactivated without a dedicated restoration use case.");
    }
    return new TravelerDocument({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): TravelerDocument {
    return new TravelerDocument({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): TravelerDocumentSnapshot {
    return this.state;
  }
}
