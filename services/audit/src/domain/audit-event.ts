import type { EntityId, TenantId, UserId } from "@totem/shared-kernel";

export type AuditEvent = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly actorUserId: UserId | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: EntityId | null;
  readonly payload: Record<string, unknown>;
  readonly occurredAt: string;
  readonly sealedAt: string | null;
};

export function assertAppendOnly(event: AuditEvent): void {
  if (event.sealedAt !== null) {
    throw new Error("Sealed audit event cannot be modified.");
  }
}
