import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { Notification } from "../domain/entities.js";
import type { NotificationRepository } from "../ports/repositories.js";
import type { ChangeNotificationStatusCommand, CreateNotificationCommand, UpdateNotificationCommand } from "./commands.js";
import type { GetNotificationQuery, ListNotificationsQuery } from "./queries.js";

export class CreateNotificationUseCase {
  constructor(private readonly repository: NotificationRepository, private readonly clock: () => string) {}

  async execute(command: CreateNotificationCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = Notification.create({
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

export class UpdateNotificationUseCase {
  constructor(private readonly repository: NotificationRepository, private readonly clock: () => string) {}

  async execute(command: UpdateNotificationCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Notification not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeNotificationStatusUseCase {
  constructor(private readonly repository: NotificationRepository, private readonly clock: () => string) {}

  async execute(command: ChangeNotificationStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Notification not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetNotificationUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(query: GetNotificationQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("Notification not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListNotificationsUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(query: ListNotificationsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
