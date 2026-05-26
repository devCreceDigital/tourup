import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { PlatformTenantView } from "../domain/entities.js";
import type { PlatformTenantViewRepository } from "../ports/repositories.js";
import type { ChangePlatformTenantViewStatusCommand, CreatePlatformTenantViewCommand, UpdatePlatformTenantViewCommand } from "./commands.js";
import type { GetPlatformTenantViewQuery, ListPlatformTenantViewsQuery } from "./queries.js";

export class CreatePlatformTenantViewUseCase {
  constructor(private readonly repository: PlatformTenantViewRepository, private readonly clock: () => string) {}

  async execute(command: CreatePlatformTenantViewCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = PlatformTenantView.create({
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

export class UpdatePlatformTenantViewUseCase {
  constructor(private readonly repository: PlatformTenantViewRepository, private readonly clock: () => string) {}

  async execute(command: UpdatePlatformTenantViewCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("PlatformTenantView not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangePlatformTenantViewStatusUseCase {
  constructor(private readonly repository: PlatformTenantViewRepository, private readonly clock: () => string) {}

  async execute(command: ChangePlatformTenantViewStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("PlatformTenantView not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetPlatformTenantViewUseCase {
  constructor(private readonly repository: PlatformTenantViewRepository) {}

  async execute(query: GetPlatformTenantViewQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("PlatformTenantView not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListPlatformTenantViewsUseCase {
  constructor(private readonly repository: PlatformTenantViewRepository) {}

  async execute(query: ListPlatformTenantViewsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
