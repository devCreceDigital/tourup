import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { TravelerDocument } from "../domain/entities.js";
import type { TravelerDocumentRepository } from "../ports/repositories.js";
import type { ChangeTravelerDocumentStatusCommand, CreateTravelerDocumentCommand, UpdateTravelerDocumentCommand } from "./commands.js";
import type { GetTravelerDocumentQuery, ListTravelerDocumentsQuery } from "./queries.js";

export class CreateTravelerDocumentUseCase {
  constructor(private readonly repository: TravelerDocumentRepository, private readonly clock: () => string) {}

  async execute(command: CreateTravelerDocumentCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = TravelerDocument.create({
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

export class UpdateTravelerDocumentUseCase {
  constructor(private readonly repository: TravelerDocumentRepository, private readonly clock: () => string) {}

  async execute(command: UpdateTravelerDocumentCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("TravelerDocument not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeTravelerDocumentStatusUseCase {
  constructor(private readonly repository: TravelerDocumentRepository, private readonly clock: () => string) {}

  async execute(command: ChangeTravelerDocumentStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("TravelerDocument not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetTravelerDocumentUseCase {
  constructor(private readonly repository: TravelerDocumentRepository) {}

  async execute(query: GetTravelerDocumentQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("TravelerDocument not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListTravelerDocumentsUseCase {
  constructor(private readonly repository: TravelerDocumentRepository) {}

  async execute(query: ListTravelerDocumentsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
