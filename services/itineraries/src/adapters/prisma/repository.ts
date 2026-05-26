import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import { Itinerary, type ItinerarySnapshot } from "../../domain/entities.js";
import type { ItineraryRepository } from "../../ports/repositories.js";

type ItineraryRecord = {
  id: string;
  tenantId: string | null;
  status: string;
  version: number;
  payload: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function toSnapshot(record: ItineraryRecord): ItinerarySnapshot {
  return {
    id: record.id as EntityId,
    tenantId: record.tenantId as TenantId | null,
    status: record.status as ItinerarySnapshot["status"],
    version: record.version,
    payload: record.payload as Record<string, unknown>,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export class PrismaItineraryRepository implements ItineraryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: EntityId, tenantId: TenantId | null): Promise<Itinerary | null> {
    const record = await this.prisma.itineraryRecord.findFirst({
      where: { id: String(id), tenantId: tenantId === null ? null : String(tenantId) }
    });
    return record === null ? null : Itinerary.rehydrate(toSnapshot(record));
  }

  async findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Itinerary | null> {
    const record = await this.prisma.itineraryRecord.findUnique({
      where: { idempotencyKey: String(idempotencyKey) }
    });
    return record === null ? null : Itinerary.rehydrate(toSnapshot(record));
  }

  async listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly ItinerarySnapshot[]> {
    const records = await this.prisma.itineraryRecord.findMany({
      where: { tenantId: tenantId === null ? null : String(tenantId) },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return records.map(toSnapshot);
  }

  async save(entity: Itinerary, idempotencyKey?: IdempotencyKey): Promise<void> {
    const snapshot = entity.toSnapshot();
    const where = idempotencyKey === undefined ? { id: String(snapshot.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.itineraryRecord.upsert({
      where,
      create: {
        id: String(snapshot.id),
        tenantId: snapshot.tenantId === null ? null : String(snapshot.tenantId),
        status: snapshot.status,
        version: snapshot.version,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(snapshot.payload)
      },
      update: {
        tenantId: snapshot.tenantId === null ? null : String(snapshot.tenantId),
        status: snapshot.status,
        version: snapshot.version,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: toJsonObject(snapshot.payload)
      }
    });
  }
}
