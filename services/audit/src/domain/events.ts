import type { DomainEvent } from "@totem/shared-kernel";

export type AuditEventEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "AuditEventCreated" | "AuditEventUpdated" | "AuditEventStatusChanged";
};
