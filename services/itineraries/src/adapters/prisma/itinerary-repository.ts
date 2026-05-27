import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { ItineraryRepository } from "../../application/itinerary-use-cases.js";
import type { Itinerary } from "../../domain/itinerary.js";

function asItinerary(payload: unknown): Itinerary {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new Error("Itinerary payload is not an object.");
  return payload as Itinerary;
}

export class PrismaItineraryRepository implements ItineraryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(tenantId: TenantId, id: EntityId): Promise<Itinerary | null> {
    const record = await this.prisma.itineraryRecord.findFirst({ where: { id: String(id), tenantId: String(tenantId) } });
    return record === null ? null : asItinerary(record.payload);
  }

  async save(itinerary: Itinerary, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(itinerary.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.itineraryRecord.upsert({
      where,
      create: {
        id: String(itinerary.id),
        tenantId: String(itinerary.tenantId),
        status: itinerary.status,
        version: itinerary.version,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(itinerary)
      },
      update: { status: itinerary.status, version: itinerary.version, ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }), payload: toJsonObject(itinerary) }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(itinerary.id),
      tenantId: itinerary.tenantId,
      eventType: `itineraries.itinerary.${itinerary.status}`,
      payload: { itineraryId: String(itinerary.id), name: itinerary.name, status: itinerary.status, version: itinerary.version }
    });
  }
}
