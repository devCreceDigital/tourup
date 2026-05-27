import type { EntityId, TenantId } from "@totem/shared-kernel";

export type AssistantSession = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly token: string;
  readonly language: "es" | "en";
  readonly status: "active" | "completed" | "expired";
  readonly intentData: Record<string, unknown>;
};

export type AssistantLead = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly travelerName: string;
  readonly travelerEmail: string;
  readonly message: string | null;
  readonly matchedTripId: EntityId | null;
  readonly status: "new" | "contacted" | "converted" | "closed";
};
