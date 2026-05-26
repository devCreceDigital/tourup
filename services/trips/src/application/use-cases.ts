import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { Trip } from "../domain/entities.js";
import type { TripRepository } from "../ports/repositories.js";
import type { ChangeTripStatusCommand, CreateTripCommand, UpdateTripCommand } from "./commands.js";
import type { GetTripQuery, ListTripsQuery } from "./queries.js";

export class CreateTripUseCase {
  constructor(private readonly repository: TripRepository, private readonly clock: () => string) {}

  async execute(command: CreateTripCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = Trip.create({
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

export class UpdateTripUseCase {
  constructor(private readonly repository: TripRepository, private readonly clock: () => string) {}

  async execute(command: UpdateTripCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Trip not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeTripStatusUseCase {
  constructor(private readonly repository: TripRepository, private readonly clock: () => string) {}

  async execute(command: ChangeTripStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Trip not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetTripUseCase {
  constructor(private readonly repository: TripRepository) {}

  async execute(query: GetTripQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("Trip not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListTripsUseCase {
  constructor(private readonly repository: TripRepository) {}

  async execute(query: ListTripsQuery, context: TenantContext) {
    if (context.isPublic) {
      return this.repository.listPublic(query.page, query.pageSize);
    }
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
