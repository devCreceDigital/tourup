import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { AuditEvent } from "../domain/entities.js";
import type { AuditEventRepository } from "../ports/repositories.js";
import type { ChangeAuditEventStatusCommand, CreateAuditEventCommand, UpdateAuditEventCommand } from "./commands.js";
import type { GetAuditEventQuery, ListAuditEventsQuery } from "./queries.js";

export class CreateAuditEventUseCase {
  constructor(private readonly repository: AuditEventRepository, private readonly clock: () => string) {}

  async execute(command: CreateAuditEventCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = AuditEvent.create({
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

export class UpdateAuditEventUseCase {
  constructor(private readonly repository: AuditEventRepository, private readonly clock: () => string) {}

  async execute(command: UpdateAuditEventCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("AuditEvent not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeAuditEventStatusUseCase {
  constructor(private readonly repository: AuditEventRepository, private readonly clock: () => string) {}

  async execute(command: ChangeAuditEventStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("AuditEvent not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetAuditEventUseCase {
  constructor(private readonly repository: AuditEventRepository) {}

  async execute(query: GetAuditEventQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("AuditEvent not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListAuditEventsUseCase {
  constructor(private readonly repository: AuditEventRepository) {}

  async execute(query: ListAuditEventsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
