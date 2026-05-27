import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId, parseUserId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { RecordAuditEvent, type AuditRepository } from "../../application/audit-use-cases.js";
import type { AuditEvent } from "../../domain/audit-event.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

export function createAuditBusinessRoutes(repository: AuditRepository): readonly Route[] {
  const recordAudit = new RecordAuditEvent(repository);
  return [
    {
      method: "POST",
      path: "/audit/events",
      handler: async (request) => {
        const body = record(request.body);
        const event: AuditEvent = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId,
          actorUserId: typeof body.actorUserId === "string" ? parseUserId(body.actorUserId) : request.context.userId,
          action: text(body, "action"),
          resourceType: text(body, "resourceType"),
          resourceId: typeof body.resourceId === "string" ? parseEntityId(body.resourceId) : null,
          payload: record(body.payload ?? {}),
          occurredAt: new Date().toISOString(),
          sealedAt: null
        };
        const key = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${event.action}:${event.resourceType}:${event.id}`);
        return recordAudit.execute(event, key, request.context);
      }
    }
  ];
}
