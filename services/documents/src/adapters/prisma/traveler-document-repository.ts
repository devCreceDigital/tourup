import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { TravelerDocumentRepository } from "../../application/document-use-cases.js";
import type { TravelerDocument } from "../../domain/traveler-document.js";

function asTravelerDocument(payload: unknown): TravelerDocument {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Traveler document payload is not an object.");
  }
  return payload as TravelerDocument;
}

export class PrismaTravelerDocumentRepository implements TravelerDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(tenantId: TenantId, documentId: EntityId): Promise<TravelerDocument | null> {
    const record = await this.prisma.travelerDocumentRecord.findFirst({
      where: { id: String(documentId), tenantId: String(tenantId) }
    });
    return record === null ? null : asTravelerDocument(record.payload);
  }

  async save(document: TravelerDocument, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(document.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.travelerDocumentRecord.upsert({
      where,
      create: {
        id: String(document.id),
        tenantId: String(document.tenantId),
        status: document.status,
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(document)
      },
      update: {
        status: document.status,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: toJsonObject(document)
      }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(document.id),
      tenantId: document.tenantId,
      eventType: `documents.document.${document.status}`,
      payload: { documentId: String(document.id), enrollmentId: String(document.enrollmentId), status: document.status }
    });
  }
}
