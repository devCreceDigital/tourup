import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { TravelerDocumentStatus } from "../domain/entities.js";

export type CreateTravelerDocumentCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: TravelerDocumentStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateTravelerDocumentCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeTravelerDocumentStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: TravelerDocumentStatus;
};

export type DocumentsCommandName =
  | "UploadDocument"
  | "ApproveDocument"
  | "RejectDocument"
  | "DeleteDocument";
