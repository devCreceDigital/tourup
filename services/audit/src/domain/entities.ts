import type { EntityId, TenantId } from "@totem/shared-kernel";
import { AuditEventInvariantViolation } from "./errors.js";

export type AuditEventStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type AuditEventSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: AuditEventStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class AuditEvent {
  private constructor(private readonly state: AuditEventSnapshot) {}

  static create(input: Omit<AuditEventSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): AuditEvent {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new AuditEventInvariantViolation("A new audit event cannot start in a terminal state.");
    }
    return new AuditEvent({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: AuditEventSnapshot): AuditEvent {
    return new AuditEvent(snapshot);
  }

  changeStatus(status: AuditEventStatus, now: string): AuditEvent {
    if (this.state.status === "archived" && status !== "archived") {
      throw new AuditEventInvariantViolation("Archived audit event cannot be reactivated without a dedicated restoration use case.");
    }
    return new AuditEvent({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): AuditEvent {
    return new AuditEvent({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): AuditEventSnapshot {
    return this.state;
  }
}
