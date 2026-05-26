import type { EntityId, TenantId } from "@totem/shared-kernel";
import { CatalogItemInvariantViolation } from "./errors.js";

export type CatalogItemStatus = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type CatalogItemSnapshot = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: CatalogItemStatus;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class CatalogItem {
  private constructor(private readonly state: CatalogItemSnapshot) {}

  static create(input: Omit<CatalogItemSnapshot, "version" | "createdAt" | "updatedAt"> & { readonly now: string }): CatalogItem {
    if (input.status === "cancelled" || input.status === "completed") {
      throw new CatalogItemInvariantViolation("A new catalog item cannot start in a terminal state.");
    }
    return new CatalogItem({
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    });
  }

  static rehydrate(snapshot: CatalogItemSnapshot): CatalogItem {
    return new CatalogItem(snapshot);
  }

  changeStatus(status: CatalogItemStatus, now: string): CatalogItem {
    if (this.state.status === "archived" && status !== "archived") {
      throw new CatalogItemInvariantViolation("Archived catalog item cannot be reactivated without a dedicated restoration use case.");
    }
    return new CatalogItem({
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  updatePayload(payload: Record<string, unknown>, now: string): CatalogItem {
    return new CatalogItem({
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    });
  }

  toSnapshot(): CatalogItemSnapshot {
    return this.state;
  }
}
