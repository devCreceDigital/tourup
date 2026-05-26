import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { TripCatalogRepository } from "../../application/trip-use-cases.js";
import type { TripDetails } from "../../domain/trip.js";

function asTripDetails(payload: unknown): TripDetails {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Trip payload is not an object.");
  }
  return payload as TripDetails;
}

export class PrismaTripCatalogRepository implements TripCatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySlug(tenantId: TenantId, slug: string): Promise<TripDetails | null> {
    const record = await this.prisma.tripRecord.findFirst({
      where: {
        tenantId: String(tenantId),
        payload: { path: ["publicIdentity", "slug"], equals: slug }
      }
    });
    return record === null ? null : asTripDetails(record.payload);
  }

  async findById(tenantId: TenantId, tripId: EntityId): Promise<TripDetails | null> {
    const record = await this.prisma.tripRecord.findFirst({
      where: { id: String(tripId), tenantId: String(tenantId) }
    });
    return record === null ? null : asTripDetails(record.payload);
  }

  async countByTenant(tenantId: TenantId): Promise<number> {
    return this.prisma.tripRecord.count({ where: { tenantId: String(tenantId) } });
  }

  async save(trip: TripDetails, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(trip.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.tripRecord.upsert({
      where,
      create: {
        id: String(trip.id),
        tenantId: String(trip.tenantId),
        status: trip.lifecycle,
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(trip)
      },
      update: {
        tenantId: String(trip.tenantId),
        status: trip.lifecycle,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: toJsonObject(trip)
      }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(trip.id),
      tenantId: trip.tenantId,
      eventType: `trips.trip.${trip.lifecycle}`,
      payload: { tripId: String(trip.id), slug: trip.publicIdentity.slug, name: trip.publicIdentity.name, lifecycle: trip.lifecycle }
    });
  }
}
