import type { DomainEvent } from "@totem/shared-kernel";

export type CatalogItemEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "CatalogItemCreated" | "CatalogItemUpdated" | "CatalogItemStatusChanged";
};
