import type { EntityId, TenantId } from "@totem/shared-kernel";
import { EnrollmentInvariantViolation } from "./errors.js";

export type EnrollmentStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type EnrollmentSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: EnrollmentStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class Enrollment {
  private constructor(private readonly state: EnrollmentSnapshot) {}

  static create(input: Omit<EnrollmentSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): Enrollment {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new EnrollmentInvariantViolation("A new enrollment cannot start in a terminal state.");
    }
    return new Enrollment({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: EnrollmentSnapshot): Enrollment {
    return new Enrollment(snapshot);
  }

  changeStatus(status: EnrollmentStatus, now: string): Enrollment {
    if (this.state.status === "archived" && status !== "archived") {
      throw new EnrollmentInvariantViolation("Archived enrollment cannot be reactivated without a dedicated restoration use case.");
    }
    return new Enrollment({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): Enrollment {
    return new Enrollment({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): EnrollmentSnapshot {
    return this.state;
  }
}
