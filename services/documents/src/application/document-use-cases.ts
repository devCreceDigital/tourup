import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant, validateUploadUrl } from "@totem/shared-kernel";
import { assertReviewable, type TravelerDocument } from "../domain/traveler-document.js";

export interface TravelerDocumentRepository {
  findById(tenantId: TenantId, documentId: EntityId): Promise<TravelerDocument | null>;
  save(document: TravelerDocument, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export interface DocumentAuditPort {
  recordDocumentReview(document: TravelerDocument, action: "approved" | "rejected", context: TenantContext): Promise<void>;
}

export class ApproveTravelerDocument {
  constructor(private readonly documents: TravelerDocumentRepository, private readonly audit: DocumentAuditPort) {}

  async execute(documentId: EntityId, context: TenantContext): Promise<TravelerDocument> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const document = await this.documents.findById(tenantId, documentId);
    if (document === null) {
      throw new Error("Document not found.");
    }
    assertReviewable(document);
    const approved: TravelerDocument = {
      ...document,
      status: "aprobado",
      rejectionReason: null,
      reviewedAt: new Date().toISOString()
    };
    await this.documents.save(approved);
    await this.audit.recordDocumentReview(approved, "approved", context);
    return approved;
  }
}

export class UploadTravelerDocument {
  constructor(private readonly documents: TravelerDocumentRepository) {}

  async execute(document: TravelerDocument, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<TravelerDocument> {
    const tenantId = requireTenant(context);
    validateUploadUrl(document.url);
    const owned: TravelerDocument = {
      ...document,
      tenantId,
      status: "en_revision",
      rejectionReason: null,
      reviewedAt: null
    };
    await this.documents.save(owned, idempotencyKey);
    return owned;
  }
}

export class RejectTravelerDocument {
  constructor(private readonly documents: TravelerDocumentRepository, private readonly audit: DocumentAuditPort) {}

  async execute(input: { readonly documentId: EntityId; readonly reason: string }, context: TenantContext): Promise<TravelerDocument> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const document = await this.documents.findById(tenantId, input.documentId);
    if (document === null) throw new Error("Document not found.");
    assertReviewable(document);
    const rejected: TravelerDocument = {
      ...document,
      status: "rechazado",
      rejectionReason: input.reason,
      reviewedAt: new Date().toISOString()
    };
    await this.documents.save(rejected);
    await this.audit.recordDocumentReview(rejected, "rejected", context);
    return rejected;
  }
}
