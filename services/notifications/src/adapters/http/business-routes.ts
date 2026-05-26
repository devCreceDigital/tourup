import { randomUUID } from "node:crypto";
import { ForbiddenError, parseEntityId, parseIdempotencyKey, parseTenantId, parseUserId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { CreateNotification, DispatchEmailNotification, SendTransactionalEmail, type EmailPort, type NotificationRepository } from "../../application/notification-use-cases.js";
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

/**
 * Envía emails via Resend API.
 * Usado en producción cuando RESEND_API_KEY está configurada.
 */
class ResendEmailPort implements EmailPort {
  async send(input: { to: string; subject: string; body: string }): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (typeof apiKey !== "string" || apiKey.length === 0) {
      throw new Error("RESEND_API_KEY is required for email delivery.");
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.DEFAULT_FROM_EMAIL ?? "noreply@totemhub.com",
        to: input.to,
        subject: input.subject,
        text: input.body
      })
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      throw new Error(`Email delivery failed (${response.status}): ${errorText}`);
    }
  }
}

/**
 * Imprime emails en consola en lugar de enviarlos.
 * Fallback para desarrollo local sin RESEND_API_KEY configurada.
 */
class ConsoleEmailPort implements EmailPort {
  async send(input: { to: string; subject: string; body: string }): Promise<void> {
    // En desarrollo local los emails se loguean en lugar de enviarse
    const divider = "─".repeat(60);
    console.log(`\n📧 [DEV EMAIL] ${divider}`);
    console.log(`  To:      ${input.to}`);
    console.log(`  Subject: ${input.subject}`);
    console.log(`  Body:\n${input.body.split("\n").map((l) => `    ${l}`).join("\n")}`);
    console.log(`${divider}\n`);
  }
}

/** Elige el puerto de email según la configuración disponible. */
function createEmailPort(): EmailPort {
  if (typeof process.env.RESEND_API_KEY === "string" && process.env.RESEND_API_KEY.length > 0) {
    return new ResendEmailPort();
  }
  return new ConsoleEmailPort();
}

// ── Idempotency store (deduplicación de emails del sistema) ──────────────────
// Previene el envío duplicado de emails cuando identity reintenta una llamada
// fallida. TTL de 24 horas; compactación automática cada 100 escrituras.
//
// Estructura: Map<idempotencyKey, expiryTimestamp>
// Las funciones se exportan con prefijo _ para uso exclusivo en tests.
export const IDEM_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
export const _idempotencyStore = new Map<string, number>();

/**
 * Comprueba si la clave ya fue procesada y sigue vigente.
 * @returns true  → duplicado (no enviar)
 *          false → clave nueva o expirada (procesar normalmente)
 */
export function isDuplicate(key: string): boolean {
  const expiry = _idempotencyStore.get(key);
  if (expiry === undefined) return false;
  if (expiry <= Date.now()) {
    _idempotencyStore.delete(key); // expirada → limpiar
    return false;
  }
  return true;
}

/**
 * Registra la clave como procesada.
 * Compacta entradas expiradas cada 100 escrituras para evitar memory leaks.
 */
export function markProcessed(key: string): void {
  _idempotencyStore.set(key, Date.now() + IDEM_TTL_MS);
  if (_idempotencyStore.size % 100 === 0) {
    const now = Date.now();
    for (const [k, expiry] of _idempotencyStore) {
      if (expiry <= now) _idempotencyStore.delete(k);
    }
  }
}

export function createNotificationBusinessRoutes(repository: NotificationRepository): readonly Route[] {
  const emailPort = createEmailPort();
  const createNotification = new CreateNotification(repository);
  const dispatchEmail = new DispatchEmailNotification(repository, emailPort);
  const sendTransactional = new SendTransactionalEmail(emailPort);

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

    // ── POST /notifications/send-email ───────────────────────────────────────
    // Soporta dos flujos:
    //
    //   1. Sistema interno (role === "system") — sin tenant:
    //      Llamado por identity para emails de verificación, reset, etc.
    //      No necesita tenantId. Envía el email de forma fire-and-forget.
    //
    //   2. Tenant autenticado — con tenant:
    //      Persiste la notificación en la BD y la despacha.
    //      Requiere tenantId en el contexto o en el body.
    {
      method: "POST",
      path: "/notifications/send-email",
      handler: async (request) => {
        const body = record(request.body);
        const recipientEmail = text(body, "recipientEmail");
        const subject = text(body, "subject");
        const emailBody = text(body, "body");

        // ── Flujo 1: llamada interna del sistema (sin tenant) ────────────────
        if (request.context.role === "system") {
          // Deduplicación: si identity reintenta la misma operación (mismo
          // idempotency key) respondemos OK sin reenviar el email.
          const idemKey =
            typeof request.headers["x-idempotency-key"] === "string"
              ? request.headers["x-idempotency-key"]
              : null;

          if (idemKey !== null && isDuplicate(idemKey)) {
            return { sent: true, deduplicated: true };
          }

          await sendTransactional.execute({ to: recipientEmail, subject, body: emailBody });

          if (idemKey !== null) markProcessed(idemKey);

          return { sent: true, message: "Email sent successfully." };
        }

        // ── Flujo 2: llamada de tenant autenticado (persiste en BD) ──────────
        if (request.context.tenantId === null && typeof body.tenantId !== "string") {
          throw new ForbiddenError("tenantId is required for non-system email dispatch.");
        }
        const notification: Notification = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(text(body, "tenantId")),
          recipientUserId: null,
          recipientEmail,
          channel: "email",
          subject,
          body: emailBody,
          status: "pendiente",
          metadata: record(body.metadata ?? {})
        };
        return dispatchEmail.execute(notification, request.context);
      }
    }
  ];
}
