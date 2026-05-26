import type { EntityId, TenantId } from "@totem/shared-kernel";
import { SupportTicketInvariantViolation } from "./errors.js";

export type SupportTicketStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type SupportTicketSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: SupportTicketStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class SupportTicket {
  private constructor(private readonly state: SupportTicketSnapshot) {}

  static create(input: Omit<SupportTicketSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): SupportTicket {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new SupportTicketInvariantViolation("A new support ticket cannot start in a terminal state.");
    }
    return new SupportTicket({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: SupportTicketSnapshot): SupportTicket {
    return new SupportTicket(snapshot);
  }

  changeStatus(status: SupportTicketStatus, now: string): SupportTicket {
    if (this.state.status === "archived" && status !== "archived") {
      throw new SupportTicketInvariantViolation("Archived support ticket cannot be reactivated without a dedicated restoration use case.");
    }
    return new SupportTicket({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): SupportTicket {
    return new SupportTicket({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): SupportTicketSnapshot {
    return this.state;
  }
}
