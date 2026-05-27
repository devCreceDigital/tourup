import type { EntityId, Money, TenantId } from "@totem/shared-kernel";

export type CatalogScope = "global" | "tenant";
export type CatalogItemKind = "destino" | "actividad" | "alojamiento" | "complemento";
export type CatalogItemStatus = "borrador" | "publicado" | "archivado";

export type CatalogItem = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly scope: CatalogScope;
  readonly kind: CatalogItemKind;
  readonly name: string;
  readonly description: string;
  readonly location: string | null;
  readonly priceFrom: Money | null;
  readonly status: CatalogItemStatus;
  readonly metadata: Record<string, unknown>;
};

export function assertCatalogOwnership(item: CatalogItem): void {
  if (item.scope === "tenant" && item.tenantId === null) {
    throw new Error("Tenant-scoped catalog item requires tenant id.");
  }
  if (item.scope === "global" && item.tenantId !== null) {
    throw new Error("Global catalog item cannot be owned by a tenant.");
  }
}

export function assertPublishableCatalogItem(item: CatalogItem): void {
  assertCatalogOwnership(item);
  if (item.name.trim().length === 0) {
    throw new Error("Catalog item requires name.");
  }
}
