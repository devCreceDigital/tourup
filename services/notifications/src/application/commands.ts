import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { NotificationStatus } from "../domain/entities.js";

export type CreateNotificationCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: NotificationStatus;
  readonly payload: Record<string, unknown>;
};

export type UpdateNotificationCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
};

export type ChangeNotificationStatusCommand = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: NotificationStatus;
};

export type NotificationsCommandName =
  | "CreateNotification"
  | "MarkNotificationRead"
  | "SendEmailNotification"
  | "DismissNotification";
