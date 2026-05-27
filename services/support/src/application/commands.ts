import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { SupportTicketStatus } from "../domain/entities.js";

export type CreateSupportTicketCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: SupportTicketStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateSupportTicketCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeSupportTicketStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: SupportTicketStatus;
};

export type SupportCommandName =
  | "CreateSupportTicket"
  | "RespondSupportTicket"
  | "ChangeTicketStatus"
  | "EscalateTicket";
