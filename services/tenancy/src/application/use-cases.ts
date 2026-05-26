import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { Tenant } from "../domain/entities.js";
import type { TenantRepository } from "../ports/repositories.js";
import type { ChangeTenantStatusCommand, CreateTenantCommand, UpdateTenantCommand } from "./commands.js";
import type { GetTenantQuery, ListTenantsQuery } from "./queries.js";

export class CreateTenantUseCase {
  constructor(private readonly repository: TenantRepository, private readonly clock: () => string) {}

  async execute(command: CreateTenantCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = Tenant.create({
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

export class UpdateTenantUseCase {
  constructor(private readonly repository: TenantRepository, private readonly clock: () => string) {}

  async execute(command: UpdateTenantCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Tenant not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeTenantStatusUseCase {
  constructor(private readonly repository: TenantRepository, private readonly clock: () => string) {}

  async execute(command: ChangeTenantStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("Tenant not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetTenantUseCase {
  constructor(private readonly repository: TenantRepository) {}

  async execute(query: GetTenantQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("Tenant not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListTenantsUseCase {
  constructor(private readonly repository: TenantRepository) {}

  async execute(query: ListTenantsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
