import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { AssistantSession } from "../domain/entities.js";
import type { AssistantSessionRepository } from "../ports/repositories.js";
import type { ChangeAssistantSessionStatusCommand, CreateAssistantSessionCommand, UpdateAssistantSessionCommand } from "./commands.js";
import type { GetAssistantSessionQuery, ListAssistantSessionsQuery } from "./queries.js";

export class CreateAssistantSessionUseCase {
  constructor(private readonly repository: AssistantSessionRepository, private readonly clock: () => string) {}

  async execute(command: CreateAssistantSessionCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = AssistantSession.create({
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

export class UpdateAssistantSessionUseCase {
  constructor(private readonly repository: AssistantSessionRepository, private readonly clock: () => string) {}

  async execute(command: UpdateAssistantSessionCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("AssistantSession not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeAssistantSessionStatusUseCase {
  constructor(private readonly repository: AssistantSessionRepository, private readonly clock: () => string) {}

  async execute(command: ChangeAssistantSessionStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("AssistantSession not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetAssistantSessionUseCase {
  constructor(private readonly repository: AssistantSessionRepository) {}

  async execute(query: GetAssistantSessionQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("AssistantSession not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListAssistantSessionsUseCase {
  constructor(private readonly repository: AssistantSessionRepository) {}

  async execute(query: ListAssistantSessionsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
