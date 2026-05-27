import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertCatalogOwnership, assertPublishableCatalogItem, type CatalogItem, type CatalogItemKind } from "../domain/catalog-item.js";

export interface CatalogRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<CatalogItem | null>;
  listVisible(tenantId: TenantId | null, kind: CatalogItemKind | null): Promise<readonly CatalogItem[]>;
  save(item: CatalogItem, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class CreateCatalogItem {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(item: CatalogItem, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<CatalogItem> {
    assertAdmin(context);
    if (item.scope === "tenant") {
      const tenantId = requireTenant(context);
      const tenantItem = { ...item, tenantId };
      assertCatalogOwnership(tenantItem);
      await this.catalog.save(tenantItem, idempotencyKey);
      return tenantItem;
    }
    assertCatalogOwnership(item);
    await this.catalog.save(item, idempotencyKey);
    return item;
  }
}

export class PublishCatalogItem {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(id: EntityId, context: TenantContext): Promise<CatalogItem> {
    assertAdmin(context);
    const tenantId = context.role === "superadmin" ? null : requireTenant(context);
    const item = await this.catalog.findById(id, tenantId);
    if (item === null) {
      throw new Error("Catalog item not found.");
    }
    assertPublishableCatalogItem(item);
    const published: CatalogItem = { ...item, status: "publicado" };
    await this.catalog.save(published);
    return published;
  }
}
