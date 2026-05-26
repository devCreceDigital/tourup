import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import { Trip, type TripSnapshot } from "../../domain/entities.js";
import type { TripRepository } from "../../ports/repositories.js";

type TripRecord = {
  id: string;
  tenantId: string | null;
  status: string;
  version: number;
  payload: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function toSnapshot(record: TripRecord): TripSnapshot {
  return {
    id: record.id as EntityId,
    tenantId: record.tenantId as TenantId | null,
    status: record.status as TripSnapshot["status"],
    version: record.version,
    payload: record.payload as Record<string, unknown>,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export class PrismaTripRepository implements TripRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: EntityId, tenantId: TenantId | null): Promise<Trip | null> {
    const record = await this.prisma.tripRecord.findFirst({
      where: { id: String(id), tenantId: tenantId === null ? null : String(tenantId) }
    });
    return record === null ? null : Trip.rehydrate(toSnapshot(record));
  }

  async findPublicBySlug(slug: string): Promise<Trip | null> {
    const record = await this.prisma.tripRecord.findFirst({
      where: {
        OR: [
          { payload: { path: ["slug"], equals: slug } },
          { payload: { path: ["publicIdentity", "slug"], equals: slug } }
        ],
        status: { in: ["active", "published"] }
      },
      orderBy: { createdAt: "desc" }
    });
    return record === null ? null : Trip.rehydrate(toSnapshot(record));
  }

  async findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Trip | null> {
    const record = await this.prisma.tripRecord.findUnique({
      where: { idempotencyKey: String(idempotencyKey) }
    });
    return record === null ? null : Trip.rehydrate(toSnapshot(record));
  }

  async listPublic(page: number, pageSize: number): Promise<readonly TripSnapshot[]> {
    const records = await this.prisma.tripRecord.findMany({
      where: {
        OR: [
          { status: { in: ["active", "published"] } },
          { payload: { path: ["estado"], equals: "publicado" } },
          { payload: { path: ["lifecycle"], equals: "published" } }
        ]
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return records.map(toSnapshot);
  }

  async listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly TripSnapshot[]> {
    const records = await this.prisma.tripRecord.findMany({
      where: { tenantId: tenantId === null ? null : String(tenantId) },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return records.map(toSnapshot);
  }

  async save(entity: Trip, idempotencyKey?: IdempotencyKey): Promise<void> {
    const snapshot = entity.toSnapshot();
    const where = idempotencyKey === undefined ? { id: String(snapshot.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.tripRecord.upsert({
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
