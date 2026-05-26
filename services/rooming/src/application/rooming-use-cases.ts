import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assignTraveler, assertValidRoomingPlan, removeTraveler, type RoomingPlanDetails } from "../domain/rooming-plan.js";

export interface RoomingRepository {
  findByTrip(tenantId: TenantId, tripId: EntityId): Promise<RoomingPlanDetails | null>;
  findById(tenantId: TenantId, id: EntityId): Promise<RoomingPlanDetails | null>;
  save(plan: RoomingPlanDetails, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class CreateTripRoomingPlan {
  constructor(private readonly rooming: RoomingRepository) {}

  async execute(plan: RoomingPlanDetails, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<RoomingPlanDetails> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const existing = await this.rooming.findByTrip(tenantId, plan.tripId);
    if (existing !== null) return existing;
    const owned: RoomingPlanDetails = { ...plan, tenantId, lifecycle: "borrador", version: 1 };
    assertValidRoomingPlan(owned);
    await this.rooming.save(owned, idempotencyKey);
    return owned;
  }
}

export class AssignTravelerToRoom {
  constructor(private readonly rooming: RoomingRepository) {}

  async execute(input: { readonly planId: EntityId; readonly travelerId: EntityId; readonly roomId: EntityId }, context: TenantContext): Promise<RoomingPlanDetails> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const plan = await this.rooming.findById(tenantId, input.planId);
    if (plan === null) throw new Error("Rooming plan not found.");
    const updated = assignTraveler(plan, input.travelerId, input.roomId);
    await this.rooming.save(updated);
    return updated;
  }
}

export class RemoveTravelerFromRoom {
  constructor(private readonly rooming: RoomingRepository) {}

  async execute(input: { readonly planId: EntityId; readonly travelerId: EntityId }, context: TenantContext): Promise<RoomingPlanDetails> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const plan = await this.rooming.findById(tenantId, input.planId);
    if (plan === null) throw new Error("Rooming plan not found.");
    const updated = removeTraveler(plan, input.travelerId);
    await this.rooming.save(updated);
    return updated;
  }
}

export class PublishRoomingPlan {
  constructor(private readonly rooming: RoomingRepository) {}

  async execute(planId: EntityId, context: TenantContext): Promise<RoomingPlanDetails> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const plan = await this.rooming.findById(tenantId, planId);
    if (plan === null) throw new Error("Rooming plan not found.");
    const published: RoomingPlanDetails = { ...plan, lifecycle: "publicado", version: plan.version + 1 };
    assertValidRoomingPlan(published);
    await this.rooming.save(published);
    return published;
  }
}
