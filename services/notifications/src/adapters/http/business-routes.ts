import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId, parseUserId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { CreateNotification, DispatchEmailNotification, type EmailPort, type NotificationRepository } from "../../application/notification-use-cases.js";
import type { Notification, NotificationChannel } from "../../domain/notification.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

function channel(value: unknown): NotificationChannel {
  return value === "email" ? "email" : "in_app";
}

class ResendEmailPort implements EmailPort {
  async send(input: { to: string; subject: string; body: string }): Promise<void> {
    if (process.env.RESEND_API_KEY === undefined) throw new Error("RESEND_API_KEY is required.");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.DEFAULT_FROM_EMAIL ?? "noreply@totemhub.com", to: input.to, subject: input.subject, text: input.body })
    });
    if (!response.ok) throw new Error("Email delivery failed.");
  }
}

export function createNotificationBusinessRoutes(repository: NotificationRepository): readonly Route[] {
  const createNotification = new CreateNotification(repository);
  const dispatchEmail = new DispatchEmailNotification(repository, new ResendEmailPort());
  return [
    {
      method: "POST",
      path: "/notifications/create",
      handler: async (request) => {
        const body = record(request.body);
        const notification: Notification = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(text(body, "tenantId")),
          recipientUserId: typeof body.recipientUserId === "string" ? parseUserId(body.recipientUserId) : null,
          recipientEmail: typeof body.recipientEmail === "string" ? body.recipientEmail : null,
          channel: channel(body.channel),
          subject: text(body, "subject"),
          body: text(body, "body"),
          status: "pendiente",
          metadata: record(body.metadata ?? {})
        };
        const key = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${notification.subject}:${randomUUID()}`);
        return createNotification.execute(notification, key, request.context);
      }
    },
    {
      method: "POST",
      path: "/notifications/send-email",
      handler: async (request) => {
        const body = record(request.body);
        const notification: Notification = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(text(body, "tenantId")),
          recipientUserId: null,
          recipientEmail: text(body, "recipientEmail"),
          channel: "email",
          subject: text(body, "subject"),
          body: text(body, "body"),
          status: "pendiente",
          metadata: record(body.metadata ?? {})
        };
        return dispatchEmail.execute(notification, request.context);
      }
    }
  ];
}
