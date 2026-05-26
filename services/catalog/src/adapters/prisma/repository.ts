import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import { CatalogItem, type CatalogItemSnapshot } from "../../domain/entities.js";
import type { CatalogItemRepository } from "../../ports/repositories.js";

type CatalogItemRecord = {
  id: string;
  tenantId: string | null;
  status: string;
  version: number;
  payload: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function toSnapshot(record: CatalogItemRecord): CatalogItemSnapshot {
  return {
    id: record.id as EntityId,
    tenantId: record.tenantId as TenantId | null,
    status: record.status as CatalogItemSnapshot["status"],
    version: record.version,
    payload: record.payload as Record<string, unknown>,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export class PrismaCatalogItemRepository implements CatalogItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: EntityId, tenantId: TenantId | null): Promise<CatalogItem | null> {
    const record = await this.prisma.catalogItemRecord.findFirst({
      where: { id: String(id), tenantId: tenantId === null ? null : String(tenantId) }
    });
    return record === null ? null : CatalogItem.rehydrate(toSnapshot(record));
  }

  async findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<CatalogItem | null> {
    const record = await this.prisma.catalogItemRecord.findUnique({
      where: { idempotencyKey: String(idempotencyKey) }
    });
    return record === null ? null : CatalogItem.rehydrate(toSnapshot(record));
  }

  async listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly CatalogItemSnapshot[]> {
    const records = await this.prisma.catalogItemRecord.findMany({
      where: { tenantId: tenantId === null ? null : String(tenantId) },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return records.map(toSnapshot);
  }

  async save(entity: CatalogItem, idempotencyKey?: IdempotencyKey): Promise<void> {
    const snapshot = entity.toSnapshot();
    const where = idempotencyKey === undefined ? { id: String(snapshot.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.catalogItemRecord.upsert({
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
