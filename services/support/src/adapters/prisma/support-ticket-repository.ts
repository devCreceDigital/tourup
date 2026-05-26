import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { SupportTicketRepository } from "../../application/support-use-cases.js";
import type { SupportTicket } from "../../domain/support-ticket.js";

function asSupportTicket(payload: unknown): SupportTicket {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new Error("Support ticket payload is not an object.");
  return payload as SupportTicket;
}

export class PrismaSupportTicketRepository implements SupportTicketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(tenantId: TenantId, id: EntityId): Promise<SupportTicket | null> {
    const record = await this.prisma.supportTicketRecord.findFirst({ where: { id: String(id), tenantId: String(tenantId) } });
    return record === null ? null : asSupportTicket(record.payload);
  }

  async save(ticket: SupportTicket, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(ticket.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.supportTicketRecord.upsert({
      where,
      create: {
        id: String(ticket.id),
        tenantId: String(ticket.tenantId),
        status: ticket.status,
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(ticket)
      },
      update: { status: ticket.status, ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }), payload: toJsonObject(ticket) }
    });
  }
}
