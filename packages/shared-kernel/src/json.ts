export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function toJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("JSON number must be finite.");
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }
  if (isPlainObject(value)) {
    const output: JsonObject = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) {
        output[key] = toJsonValue(entry);
      }
    }
    return output;
  }
  throw new Error("Value is not JSON serializable.");
}

export function toJsonObject(value: unknown): JsonObject {
  const json = toJsonValue(value);
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error("JSON payload must be an object.");
  }
  return json;
}
