import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { IdempotencyKey, TenantId } from "@totem/shared-kernel";
import type { NotificationRepository } from "../../application/notification-use-cases.js";
import type { Notification } from "../../domain/notification.js";

function asNotification(payload: unknown): Notification {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Notification payload is not an object.");
  }
  return payload as Notification;
}

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(notification: Notification, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(notification.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.notificationRecord.upsert({
      where,
      create: {
        id: String(notification.id),
        tenantId: String(notification.tenantId),
        status: notification.status,
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(notification)
      },
      update: { status: notification.status, ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }), payload: toJsonObject(notification) }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(notification.id),
      tenantId: notification.tenantId,
      eventType: `notifications.notification.${notification.status}`,
      payload: { notificationId: String(notification.id), channel: notification.channel, status: notification.status, recipientUserId: notification.recipientUserId }
    });
  }

  async listUnread(tenantId: TenantId): Promise<readonly Notification[]> {
    const records = await this.prisma.notificationRecord.findMany({
      where: { tenantId: String(tenantId), status: { in: ["pendiente", "enviada"] } },
      orderBy: { createdAt: "desc" }
    });
    return records.map((record) => asNotification(record.payload));
  }
}
