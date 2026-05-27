import type { EntityId, TenantId, UserId } from "@totem/shared-kernel";

export type NotificationChannel = "in_app" | "email";
export type NotificationStatus = "pendiente" | "enviada" | "leida" | "fallida";

export type Notification = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly recipientUserId: UserId | null;
  readonly recipientEmail: string | null;
  readonly channel: NotificationChannel;
  readonly subject: string;
  readonly body: string;
  readonly status: NotificationStatus;
  readonly metadata: Record<string, unknown>;
};

export function assertDeliverableNotification(notification: Notification): void {
  if (notification.channel === "email" && notification.recipientEmail === null) {
    throw new Error("Email notification requires recipient email.");
  }
  if (notification.channel === "in_app" && notification.recipientUserId === null) {
    throw new Error("In-app notification requires recipient user.");
  }
}
