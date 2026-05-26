import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { Subscription } from "../domain/entities.js";
import type { SubscriptionRepository } from "../ports/repositories.js";
import type { ChangeSubscriptionStatusCommand, CreateSubscriptionCommand, UpdateSubscriptionCommand } from "./commands.js";
import type { GetSubscriptionQuery, ListSubscriptionsQuery } from "./queries.js";

export class CreateSubscriptionUseCase {
  constructor(private readonly repository: SubscriptionRepository, private readonly clock: () => string) {}

  async execute(command: CreateSubscriptionCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = Subscription.create({
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

export class UpdateSubscriptionUseCase {
  constructor(private readonly repository: SubscriptionRepository, private readonly clock: () => string) {}

  async execute(command: UpdateSubscriptionCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Subscription not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeSubscriptionStatusUseCase {
  constructor(private readonly repository: SubscriptionRepository, private readonly clock: () => string) {}

  async execute(command: ChangeSubscriptionStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Subscription not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetSubscriptionUseCase {
  constructor(private readonly repository: SubscriptionRepository) {}

  async execute(query: GetSubscriptionQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("Subscription not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListSubscriptionsUseCase {
  constructor(private readonly repository: SubscriptionRepository) {}

  async execute(query: ListSubscriptionsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
