import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { SupportTicket } from "../domain/entities.js";
import type { SupportTicketRepository } from "../ports/repositories.js";
import type { ChangeSupportTicketStatusCommand, CreateSupportTicketCommand, UpdateSupportTicketCommand } from "./commands.js";
import type { GetSupportTicketQuery, ListSupportTicketsQuery } from "./queries.js";

export class CreateSupportTicketUseCase {
  constructor(private readonly repository: SupportTicketRepository, private readonly clock: () => string) {}

  async execute(command: CreateSupportTicketCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = SupportTicket.create({
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

export class UpdateSupportTicketUseCase {
  constructor(private readonly repository: SupportTicketRepository, private readonly clock: () => string) {}

  async execute(command: UpdateSupportTicketCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("SupportTicket not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeSupportTicketStatusUseCase {
  constructor(private readonly repository: SupportTicketRepository, private readonly clock: () => string) {}

  async execute(command: ChangeSupportTicketStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("SupportTicket not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetSupportTicketUseCase {
  constructor(private readonly repository: SupportTicketRepository) {}

  async execute(query: GetSupportTicketQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("SupportTicket not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListSupportTicketsUseCase {
  constructor(private readonly repository: SupportTicketRepository) {}

  async execute(query: ListSupportTicketsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
