import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { TenantContext } from "@totem/shared-kernel";
import type { DocumentAuditPort } from "../../application/document-use-cases.js";
import type { TravelerDocument } from "../../domain/traveler-document.js";

export class PrismaDocumentAuditPort implements DocumentAuditPort {
  constructor(private readonly prisma: PrismaClient) {}

  async recordDocumentReview(document: TravelerDocument, action: "approved" | "rejected", context: TenantContext): Promise<void> {
    if (context.userId === null) {
      throw new Error("Document review requires authenticated reviewer.");
    }
    await this.prisma.documentReviewRecord.create({
      data: {
        id: randomUUID(),
        tenantId: String(document.tenantId),
        documentId: String(document.id),
        reviewerUserId: String(context.userId),
        action,
        reason: document.rejectionReason
      }
    });
  }
}
