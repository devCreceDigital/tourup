import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { RoomingPlan } from "../domain/entities.js";
import type { RoomingPlanRepository } from "../ports/repositories.js";
import type { ChangeRoomingPlanStatusCommand, CreateRoomingPlanCommand, UpdateRoomingPlanCommand } from "./commands.js";
import type { GetRoomingPlanQuery, ListRoomingPlansQuery } from "./queries.js";

export class CreateRoomingPlanUseCase {
  constructor(private readonly repository: RoomingPlanRepository, private readonly clock: () => string) {}

  async execute(command: CreateRoomingPlanCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) return existing.toSnapshot();
    const entity = RoomingPlan.create({
      id: command.id,
      tenantId: tenantScope(context, command.tenantId),
      status: command.status,
      payload: command.payload,
      now: this.clock()
    });
    await this.repository.save(entity, command.idempotencyKey);
    return entity.toSnapshot();
  }
}

export class UpdateRoomingPlanUseCase {
  constructor(private readonly repository: RoomingPlanRepository, private readonly clock: () => string) {}

  async execute(command: UpdateRoomingPlanCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) throw new Error("RoomingPlan not found.");
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeRoomingPlanStatusUseCase {
  constructor(private readonly repository: RoomingPlanRepository, private readonly clock: () => string) {}

  async execute(command: ChangeRoomingPlanStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) throw new Error("RoomingPlan not found.");
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetRoomingPlanUseCase {
  constructor(private readonly repository: RoomingPlanRepository) {}

  async execute(query: GetRoomingPlanQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) throw new Error("RoomingPlan not found.");
    return entity.toSnapshot();
  }
}

export class ListRoomingPlansUseCase {
  constructor(private readonly repository: RoomingPlanRepository) {}

  async execute(query: ListRoomingPlansQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
