import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertTicketCanBeClosed, type SupportTicket } from "../domain/support-ticket.js";

export interface SupportTicketRepository {
  findById(tenantId: TenantId, id: EntityId): Promise<SupportTicket | null>;
  save(ticket: SupportTicket, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class CreateSupportTicket {
  constructor(private readonly tickets: SupportTicketRepository) {}

  async execute(ticket: SupportTicket, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<SupportTicket> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const owned = { ...ticket, tenantId, status: "abierto" as const };
    await this.tickets.save(owned, idempotencyKey);
    return owned;
  }
}

export class CreatePublicContactTicket {
  constructor(private readonly tickets: SupportTicketRepository) {}

  async execute(ticket: SupportTicket, idempotencyKey: IdempotencyKey): Promise<SupportTicket> {
    await this.tickets.save({ ...ticket, status: "abierto" }, idempotencyKey);
    return ticket;
  }
}

export class CloseSupportTicket {
  constructor(private readonly tickets: SupportTicketRepository) {}

  async execute(ticketId: EntityId, context: TenantContext): Promise<SupportTicket> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const ticket = await this.tickets.findById(tenantId, ticketId);
    if (ticket === null) {
      throw new Error("Support ticket not found.");
    }
    assertTicketCanBeClosed(ticket);
    const closed = { ...ticket, status: "cerrado" as const };
    await this.tickets.save(closed);
    return closed;
  }
}
