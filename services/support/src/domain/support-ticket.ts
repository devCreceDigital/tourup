import type { EntityId, TenantId } from "@totem/shared-kernel";

export type SupportTicket = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly adminEmail: string;
  readonly subject: string;
  readonly description: string;
  readonly priority: "normal" | "alta" | "urgente";
  readonly status: "abierto" | "respondido" | "cerrado";
  readonly answer: string | null;
};

export function assertTicketCanBeClosed(ticket: SupportTicket): void {
  if (ticket.answer === null || ticket.answer.trim().length === 0) {
    throw new Error("Support ticket requires an answer before closing.");
  }
}
