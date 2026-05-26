import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { RoomingPlan, RoomingPlanSnapshot } from "../../domain/entities.js";
import { RoomingPlan as RoomingPlanEntity } from "../../domain/entities.js";
import type { RoomingPlanRepository } from "../../ports/repositories.js";

type PersistedRecord = {
  readonly id: string;
  readonly tenantId: string | null;
  readonly status: string;
  readonly version: number;
  readonly payload: unknown;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

function toSnapshot(record: PersistedRecord): RoomingPlanSnapshot {
  return {
    id: record.id as EntityId,
    tenantId: record.tenantId as TenantId | null,
    status: record.status as RoomingPlanSnapshot["status"],
    version: record.version,
    payload: record.payload as Record<string, unknown>,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export class PrismaRoomingPlanRepository implements RoomingPlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: EntityId, tenantId: TenantId | null): Promise<RoomingPlan | null> {
    const record = await this.prisma.roomingPlanRecord.findFirst({
      where: { id: String(id), tenantId: tenantId === null ? null : String(tenantId) }
    });
    return record === null ? null : RoomingPlanEntity.rehydrate(toSnapshot(record));
  }

  async findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<RoomingPlan | null> {
    const record = await this.prisma.roomingPlanRecord.findFirst({
      where: { idempotencyKey: String(idempotencyKey) }
    });
    return record === null ? null : RoomingPlanEntity.rehydrate(toSnapshot(record));
  }

  async listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly RoomingPlanSnapshot[]> {
    const records = await this.prisma.roomingPlanRecord.findMany({
      where: { tenantId: tenantId === null ? null : String(tenantId) },
      orderBy: { createdAt: "desc" },
      skip: Math.max(page - 1, 0) * pageSize,
      take: pageSize
    });
    return records.map(toSnapshot);
  }

  async save(entity: RoomingPlan, idempotencyKey?: IdempotencyKey): Promise<void> {
    const snapshot = entity.toSnapshot();
    const where = idempotencyKey === undefined ? { id: String(snapshot.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.roomingPlanRecord.upsert({
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
