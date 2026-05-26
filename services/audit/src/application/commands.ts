import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { AuditEventStatus } from "../domain/entities.js";

export type CreateAuditEventCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: AuditEventStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateAuditEventCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeAuditEventStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: AuditEventStatus;
};

export type AuditCommandName =
  | "RecordAuditEvent"
  | "ListAuditEvents"
  | "SealAuditEvent"
  | "ExportAuditEvents";
