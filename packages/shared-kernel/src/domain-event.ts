import type { EntityId, TenantId } from "./ids.js";

export type DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  readonly eventId: EntityId;
  readonly aggregateId: EntityId;
  readonly tenantId: TenantId | null;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly payload: TPayload;
};
