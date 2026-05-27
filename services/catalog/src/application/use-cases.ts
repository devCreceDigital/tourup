import type { TenantContext } from "@totem/shared-kernel";
import { tenantScope } from "@totem/shared-kernel";
import { CatalogItem } from "../domain/entities.js";
import type { CatalogItemRepository } from "../ports/repositories.js";
import type { ChangeCatalogItemStatusCommand, CreateCatalogItemCommand, UpdateCatalogItemCommand } from "./commands.js";
import type { GetCatalogItemQuery, ListCatalogItemsQuery } from "./queries.js";

export class CreateCatalogItemUseCase {
  constructor(private readonly repository: CatalogItemRepository, private readonly clock: () => string) {}

  async execute(command: CreateCatalogItemCommand, context: TenantContext) {
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {
      return existing.toSnapshot();
    }
    const entity = CatalogItem.create({
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

export class UpdateCatalogItemUseCase {
  constructor(private readonly repository: CatalogItemRepository, private readonly clock: () => string) {}

  async execute(command: UpdateCatalogItemCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("CatalogItem not found.");
    }
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class ChangeCatalogItemStatusUseCase {
  constructor(private readonly repository: CatalogItemRepository, private readonly clock: () => string) {}

  async execute(command: ChangeCatalogItemStatusCommand, context: TenantContext) {
    const entity = await this.repository.findById(command.id, tenantScope(context, command.tenantId));
    if (entity === null) {
      throw new Error("CatalogItem not found.");
    }
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }
}

export class GetCatalogItemUseCase {
  constructor(private readonly repository: CatalogItemRepository) {}

  async execute(query: GetCatalogItemQuery, context: TenantContext) {
    const entity = await this.repository.findById(query.id, tenantScope(context, query.tenantId));
    if (entity === null) {
      throw new Error("CatalogItem not found.");
    }
    return entity.toSnapshot();
  }
}

export class ListCatalogItemsUseCase {
  constructor(private readonly repository: CatalogItemRepository) {}

  async execute(query: ListCatalogItemsQuery, context: TenantContext) {
    return this.repository.listByTenant(tenantScope(context, query.tenantId), query.page, query.pageSize);
  }
}
