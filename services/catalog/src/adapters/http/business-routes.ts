import { randomUUID } from "node:crypto";
import { createMoney, parseEntityId, parseIdempotencyKey } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { CreateCatalogItem, PublishCatalogItem, type CatalogRepository } from "../../application/catalog-use-cases.js";
import type { CatalogItem, CatalogItemKind, CatalogScope } from "../../domain/catalog-item.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

function kind(value: unknown): CatalogItemKind {
  if (value === "actividad" || value === "alojamiento" || value === "complemento") return value;
  return "destino";
}

function scope(value: unknown): CatalogScope {
  return value === "global" ? "global" : "tenant";
}

export function createCatalogBusinessRoutes(repository: CatalogRepository): readonly Route[] {
  const createItem = new CreateCatalogItem(repository);
  const publishItem = new PublishCatalogItem(repository);
  return [
    {
      method: "POST",
      path: "/catalog/items",
      handler: async (request) => {
        const body = record(request.body);
        const item: CatalogItem = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId,
          scope: scope(body.scope),
          kind: kind(body.kind),
          name: text(body, "name"),
          description: typeof body.description === "string" ? body.description : "",
          location: typeof body.location === "string" ? body.location : null,
          priceFrom: typeof body.priceFrom === "string" ? createMoney(body.priceFrom) : null,
          status: "borrador",
          metadata: record(body.metadata ?? {})
        };
        const idempotencyKey = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${item.name}:${item.kind}:${randomUUID()}`);
        return createItem.execute(item, idempotencyKey, request.context);
      }
    },
    {
      method: "POST",
      path: "/catalog/items/publish",
      handler: async (request) => publishItem.execute(parseEntityId(text(record(request.body), "itemId")), request.context)
    }
  ];
}
