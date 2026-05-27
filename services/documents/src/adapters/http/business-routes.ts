import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { ApproveTravelerDocument, RejectTravelerDocument, UploadTravelerDocument, type DocumentAuditPort, type TravelerDocumentRepository } from "../../application/document-use-cases.js";
import type { TravelerDocument } from "../../domain/traveler-document.js";

function bodyAsRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function stringField(body: Record<string, unknown>, name: string): string {
  const value = body[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

export function createDocumentBusinessRoutes(repository: TravelerDocumentRepository, audit: DocumentAuditPort): readonly Route[] {
  const approveDocument = new ApproveTravelerDocument(repository, audit);
  const uploadDocument = new UploadTravelerDocument(repository);
  const rejectDocument = new RejectTravelerDocument(repository, audit);

  return [
    {
      method: "POST",
      path: "/documents/upload",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        const document: TravelerDocument = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(stringField(body, "tenantId")),
          enrollmentId: parseEntityId(stringField(body, "enrollmentId")),
          name: stringField(body, "name"),
          type: typeof body.type === "string" ? body.type : null,
          url: stringField(body, "url"),
          required: body.required !== false,
          status: "pendiente",
          rejectionReason: null,
          reviewedAt: null,
          metadata: typeof body.metadata === "object" && body.metadata !== null && !Array.isArray(body.metadata) ? body.metadata as Record<string, unknown> : {}
        };
        const idempotencyKey =
          typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${document.tenantId}:${document.enrollmentId}:${document.name}`);
        return uploadDocument.execute(document, idempotencyKey, request.context);
      }
    },
    {
      method: "POST",
      path: "/documents/approve",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        return approveDocument.execute(parseEntityId(stringField(body, "documentId")), request.context);
      }
    },
    {
      method: "POST",
      path: "/documents/reject",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        return rejectDocument.execute({ documentId: parseEntityId(stringField(body, "documentId")), reason: stringField(body, "reason") }, request.context);
      }
    }
  ];
}
