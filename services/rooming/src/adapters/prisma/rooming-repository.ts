import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { RoomingRepository } from "../../application/rooming-use-cases.js";
import type { RoomingPlanDetails } from "../../domain/rooming-plan.js";

function asRoomingPlan(payload: unknown): RoomingPlanDetails {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Rooming plan payload is not an object.");
  }
  return payload as RoomingPlanDetails;
}

export class PrismaRoomingRepository implements RoomingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTrip(tenantId: TenantId, tripId: EntityId): Promise<RoomingPlanDetails | null> {
    const record = await this.prisma.roomingTripPlanRecord.findFirst({
      where: { tenantId: String(tenantId), tripId: String(tripId) }
    });
    return record === null ? null : asRoomingPlan(record.payload);
  }

  async findById(tenantId: TenantId, id: EntityId): Promise<RoomingPlanDetails | null> {
    const record = await this.prisma.roomingTripPlanRecord.findFirst({
      where: { id: String(id), tenantId: String(tenantId) }
    });
    return record === null ? null : asRoomingPlan(record.payload);
  }

  async save(plan: RoomingPlanDetails, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(plan.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.roomingTripPlanRecord.upsert({
      where,
      create: {
        id: String(plan.id),
        tenantId: String(plan.tenantId),
        tripId: String(plan.tripId),
        status: plan.lifecycle,
        version: plan.version,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(plan)
      },
      update: {
        status: plan.lifecycle,
        version: plan.version,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: toJsonObject(plan)
      }
    });
  }
}
