import type { IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { requireTenant } from "@totem/shared-kernel";
import { assertDeliverableNotification, type Notification } from "../domain/notification.js";

export interface NotificationRepository {
  save(notification: Notification, idempotencyKey?: IdempotencyKey): Promise<void>;
  listUnread(tenantId: TenantId): Promise<readonly Notification[]>;
}

export interface EmailPort {
  send(input: { to: string; subject: string; body: string }): Promise<void>;
}

export class CreateNotification {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(notification: Notification, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<Notification> {
    const tenantId = requireTenant(context);
    const owned: Notification = { ...notification, tenantId };
    assertDeliverableNotification(owned);
    await this.notifications.save(owned, idempotencyKey);
    return owned;
  }
}

export class DispatchEmailNotification {
  constructor(private readonly notifications: NotificationRepository, private readonly email: EmailPort) {}

  async execute(notification: Notification, context: TenantContext): Promise<Notification> {
    const tenantId = requireTenant(context);
    const owned: Notification = { ...notification, tenantId };
    assertDeliverableNotification(owned);
    if (owned.recipientEmail === null) {
      throw new Error("Recipient email is required.");
    }
    await this.email.send({ to: owned.recipientEmail, subject: owned.subject, body: owned.body });
    const sent: Notification = { ...owned, status: "enviada" };
    await this.notifications.save(sent);
    return sent;
  }
}
