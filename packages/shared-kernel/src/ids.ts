export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type TenantId = Brand<string, "TenantId">;
export type UserId = Brand<string, "UserId">;
export type EntityId = Brand<string, "EntityId">;
export type IdempotencyKey = Brand<string, "IdempotencyKey">;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseEntityId(value: string): EntityId {
  if (!uuidPattern.test(value)) {
    throw new Error("Invalid UUID.");
  }
  return value as EntityId;
}

export function parseTenantId(value: string): TenantId {
  return parseEntityId(value) as unknown as TenantId;
}

export function parseUserId(value: string): UserId {
  return parseEntityId(value) as unknown as UserId;
}

export function parseIdempotencyKey(value: string): IdempotencyKey {
  const normalized = value.trim();
  if (normalized.length < 16) {
    throw new Error("Idempotency key must have at least 16 characters.");
  }
  return normalized as IdempotencyKey;
}
