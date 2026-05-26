import type { DomainEvent } from "@totem/shared-kernel";

export type SupportTicketEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "SupportTicketCreated" | "SupportTicketUpdated" | "SupportTicketStatusChanged";
};
