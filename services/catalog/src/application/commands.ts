import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { CatalogItemStatus } from "../domain/entities.js";

export type CreateCatalogItemCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: CatalogItemStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateCatalogItemCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeCatalogItemStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: CatalogItemStatus;
};

export type CatalogCommandName =
  | "CreateCatalogItem"
  | "UpdateCatalogItem"
  | "PublishCatalogItem"
  | "ArchiveCatalogItem";
