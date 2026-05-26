import type { DomainEvent, EntityId, TenantId } from "@totem/shared-kernel";

export type RoomingPlanEvent =
  | (DomainEvent<{ readonly id: EntityId; readonly tenantId: TenantId | null }> & { readonly eventType: "rooming.plan.created" })
  | (DomainEvent<{ readonly id: EntityId; readonly status: string }> & { readonly eventType: "rooming.plan.status_changed" });
