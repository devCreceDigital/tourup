import type { EntityId, TenantId } from "@totem/shared-kernel";

export type TravelerDocumentStatus = "pendiente" | "en_revision" | "aprobado" | "rechazado";

export type TravelerDocument = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly enrollmentId: EntityId;
  readonly name: string;
  readonly type: string | null;
  readonly url: string;
  readonly required: boolean;
  readonly status: TravelerDocumentStatus;
  readonly rejectionReason: string | null;
  readonly reviewedAt: string | null;
  readonly metadata: Record<string, unknown>;
};

export function assertReviewable(document: TravelerDocument): void {
  if (document.status === "aprobado") {
    throw new Error("Approved document cannot be reviewed again without reopening.");
  }
}
