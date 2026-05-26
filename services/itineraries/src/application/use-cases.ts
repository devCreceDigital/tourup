import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { Itinerary } from "../domain/entities.js";
import type { ItineraryRepository } from "../ports/repositories.js";
import type { ChangeItineraryStatusCommand, CreateItineraryCommand, UpdateItineraryCommand } from "./commands.js";
import type { GetItineraryQuery, ListItinerarysQuery } from "./queries.js";

export class CreateItineraryUseCase {
  constructor(private readonly repository: ItineraryRepository, private readonly clock: () => string) {}

  async execute(command: CreateItineraryCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = Itinerary.create({
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

export class UpdateItineraryUseCase {
  constructor(private readonly repository: ItineraryRepository, private readonly clock: () => string) {}

  async execute(command: UpdateItineraryCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Itinerary not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeItineraryStatusUseCase {
  constructor(private readonly repository: ItineraryRepository, private readonly clock: () => string) {}

  async execute(command: ChangeItineraryStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Itinerary not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetItineraryUseCase {
  constructor(private readonly repository: ItineraryRepository) {}

  async execute(query: GetItineraryQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("Itinerary not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListItinerarysUseCase {
  constructor(private readonly repository: ItineraryRepository) {}

  async execute(query: ListItinerarysQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
