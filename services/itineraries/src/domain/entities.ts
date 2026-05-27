import type { EntityId, TenantId } from "@totem/shared-kernel";
import { ItineraryInvariantViolation } from "./errors.js";

export type ItineraryStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type ItinerarySnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: ItineraryStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class Itinerary {
  private constructor(private readonly state: ItinerarySnapshot) {}

  static create(input: Omit<ItinerarySnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): Itinerary {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new ItineraryInvariantViolation("A new itinerary cannot start in a terminal state.");
    }
    return new Itinerary({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: ItinerarySnapshot): Itinerary {
    return new Itinerary(snapshot);
  }

  changeStatus(status: ItineraryStatus, now: string): Itinerary {
    if (this.state.status === "archived" && status !== "archived") {
      throw new ItineraryInvariantViolation("Archived itinerary cannot be reactivated without a dedicated restoration use case.");
    }
    return new Itinerary({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): Itinerary {
    return new Itinerary({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): ItinerarySnapshot {
    return this.state;
  }
}
