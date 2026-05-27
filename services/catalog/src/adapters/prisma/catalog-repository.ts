import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { CatalogRepository } from "../../application/catalog-use-cases.js";
import type { CatalogItem, CatalogItemKind } from "../../domain/catalog-item.js";

function asCatalogItem(payload: unknown): CatalogItem {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Catalog payload is not an object.");
  }
  return payload as CatalogItem;
}

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: EntityId, tenantId: TenantId | null): Promise<CatalogItem | null> {
    const record = await this.prisma.catalogItemRecord.findFirst({
      where: { id: String(id), tenantId: tenantId === null ? null : String(tenantId) }
    });
    return record === null ? null : asCatalogItem(record.payload);
  }

  async listVisible(tenantId: TenantId | null, kind: CatalogItemKind | null): Promise<readonly CatalogItem[]> {
    const tenantVisibility = tenantId === null ? [{ tenantId: null }] : [{ tenantId: null }, { tenantId: String(tenantId) }];
    const records = await this.prisma.catalogItemRecord.findMany({
      where: {
        OR: tenantVisibility,
        ...(kind === null ? {} : { payload: { path: ["kind"], equals: kind } })
      },
      orderBy: { createdAt: "desc" }
    });
    return records.map((record) => asCatalogItem(record.payload));
  }

  async save(item: CatalogItem, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(item.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.catalogItemRecord.upsert({
      where,
      create: {
        id: String(item.id),
        tenantId: item.tenantId === null ? null : String(item.tenantId),
        status: item.status,
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(item)
      },
      update: {
        tenantId: item.tenantId === null ? null : String(item.tenantId),
        status: item.status,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: toJsonObject(item)
      }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(item.id),
      tenantId: item.tenantId,
      eventType: `catalog.item.${item.status}`,
      payload: { itemId: String(item.id), kind: item.kind, scope: item.scope, status: item.status, name: item.name }
    });
  }
}
