import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import { Enrollment, type EnrollmentSnapshot } from "../../domain/entities.js";
import type { EnrollmentRepository } from "../../ports/repositories.js";

type EnrollmentRecord = {
  id: string;
  tenantId: string | null;
  status: string;
  version: number;
  payload: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function toSnapshot(record: EnrollmentRecord): EnrollmentSnapshot {
  return {
    id: record.id as EntityId,
    tenantId: record.tenantId as TenantId | null,
    status: record.status as EnrollmentSnapshot["status"],
    version: record.version,
    payload: record.payload as Record<string, unknown>,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: EntityId, tenantId: TenantId | null): Promise<Enrollment | null> {
    const record = await this.prisma.enrollmentRecord.findFirst({
      where: { id: String(id), tenantId: tenantId === null ? null : String(tenantId) }
    });
    return record === null ? null : Enrollment.rehydrate(toSnapshot(record));
  }

  async findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Enrollment | null> {
    const record = await this.prisma.enrollmentRecord.findUnique({
      where: { idempotencyKey: String(idempotencyKey) }
    });
    return record === null ? null : Enrollment.rehydrate(toSnapshot(record));
  }

  async listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly EnrollmentSnapshot[]> {
    const records = await this.prisma.enrollmentRecord.findMany({
      where: { tenantId: tenantId === null ? null : String(tenantId) },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return records.map(toSnapshot);
  }

  async save(entity: Enrollment, idempotencyKey?: IdempotencyKey): Promise<void> {
    const snapshot = entity.toSnapshot();
    const where = idempotencyKey === undefined ? { id: String(snapshot.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.enrollmentRecord.upsert({
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
