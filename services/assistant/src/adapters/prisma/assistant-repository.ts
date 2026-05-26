import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey } from "@totem/shared-kernel";
import type { AssistantRepository } from "../../application/assistant-use-cases.js";
import type { AssistantLead, AssistantSession } from "../../domain/assistant.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Assistant payload is not an object.");
  return value as Record<string, unknown>;
}

function asSession(value: unknown): AssistantSession {
  const payload = record(value);
  if (typeof payload.id !== "string" || typeof payload.token !== "string" || typeof payload.status !== "string") {
    throw new Error("Assistant session payload is invalid.");
  }
  return value as AssistantSession;
}

export class PrismaAssistantRepository implements AssistantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findSessionById(id: EntityId): Promise<AssistantSession | null> {
    const recordValue = await this.prisma.assistantSessionRecord.findFirst({ where: { id: String(id) } });
    return recordValue === null ? null : asSession(recordValue.payload);
  }

  async saveSession(session: AssistantSession, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(session.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.assistantSessionRecord.upsert({
      where,
      create: {
        id: String(session.id),
        tenantId: session.tenantId === null ? null : String(session.tenantId),
        status: session.status,
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(session)
      },
      update: {
        tenantId: session.tenantId === null ? null : String(session.tenantId),
        status: session.status,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: toJsonObject(session)
      }
    });
  }

  async saveLead(lead: AssistantLead, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(lead.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.assistantLeadRecord.upsert({
      where,
      create: {
        id: String(lead.id),
        tenantId: String(lead.tenantId),
        travelerEmail: lead.travelerEmail,
        status: lead.status,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(lead)
      },
      update: {
        travelerEmail: lead.travelerEmail,
        status: lead.status,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: toJsonObject(lead)
      }
    });
  }
}
