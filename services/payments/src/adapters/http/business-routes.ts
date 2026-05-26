import { randomUUID } from "node:crypto";
import { BadRequestError, createMoney, parseEntityId, parseIdempotencyKey, parseTenantId, requireTenant, toJsonObject } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { verifyMercadoPagoWebhook } from "./mercadopago-signature.js";
import { RegisterManualPayment, RejectPayment, VerifyPayment, type PaymentRepository } from "../../application/payment-use-cases.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Payment, PaymentMethod } from "../../domain/payment.js";

function bodyAsRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function stringField(body: Record<string, unknown>, name: string): string {
  const value = body[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function paymentMethod(value: unknown): PaymentMethod {
  if (value === "efectivo" || value === "tarjeta" || value === "mercadopago" || value === "otro") {
    return value;
  }
  return "transferencia";
}

function production(): boolean {
  return process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
}

function mercadoPagoToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is required for provider payments.");
  }
  return token.trim();
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function objectPayload(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Provider response must be an object.");
  return value as Record<string, unknown>;
}

async function createMercadoPagoPreference(input: {
  readonly tenantId: string;
  readonly paymentId: string;
  readonly title: string;
  readonly amount: string;
  readonly currency: "PEN" | "USD";
  readonly payerEmail: string;
  readonly successUrl: string;
  readonly failureUrl: string;
  readonly pendingUrl: string;
}): Promise<Record<string, unknown>> {
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      authorization: `Bearer ${mercadoPagoToken()}`,
      "content-type": "application/json",
      "x-idempotency-key": input.paymentId
    },
    body: JSON.stringify({
      external_reference: input.paymentId,
      items: [{
        id: input.paymentId,
        title: input.title,
        quantity: 1,
        currency_id: input.currency,
        unit_price: Number(input.amount)
      }],
      payer: { email: input.payerEmail },
      metadata: { tenant_id: input.tenantId, payment_id: input.paymentId },
      back_urls: { success: input.successUrl, failure: input.failureUrl, pending: input.pendingUrl },
      auto_return: "approved"
    })
  });
  const payload = objectPayload(await response.json());
  if (!response.ok) {
    throw new Error(`MercadoPago preference failed: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  return payload;
}

async function getMercadoPagoPayment(paymentId: string): Promise<Record<string, unknown>> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { authorization: `Bearer ${mercadoPagoToken()}` }
  });
  const payload = objectPayload(await response.json());
  if (!response.ok) {
    throw new Error(`MercadoPago payment lookup failed: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  return payload;
}

export function createPaymentBusinessRoutes(repository: PaymentRepository, prisma: PrismaClient): readonly Route[] {
  const registerManualPayment = new RegisterManualPayment(repository);
  const verifyPayment = new VerifyPayment(repository);
  const rejectPayment = new RejectPayment(repository);

  return [
    {
      method: "POST",
      path: "/payments/checkout",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        const tenantId = requireTenant(request.context);
        if (!production() && process.env.MERCADOPAGO_ACCESS_TOKEN === undefined) {
          throw new Error("MERCADOPAGO_ACCESS_TOKEN is required. Development should use /payments/manual only when intentionally registering offline payments.");
        }
        const payment: Payment = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId,
          enrollmentId: parseEntityId(stringField(body, "enrollmentId")),
          installmentId: typeof body.installmentId === "string" ? parseEntityId(body.installmentId) : null,
          amount: createMoney(stringField(body, "amount"), body.currency === "USD" ? "USD" : "PEN"),
          method: "mercadopago",
          status: "pendiente",
          providerReference: null,
          notes: typeof body.notes === "string" ? body.notes : "",
          paidAt: null
        };
        const preference = await createMercadoPagoPreference({
          tenantId: String(tenantId),
          paymentId: String(payment.id),
          title: typeof body.title === "string" ? body.title : `Totem payment ${payment.id}`,
          amount: payment.amount.decimal,
          currency: payment.amount.currency,
          payerEmail: stringField(body, "payerEmail"),
          successUrl: stringField(body, "successUrl"),
          failureUrl: stringField(body, "failureUrl"),
          pendingUrl: stringField(body, "pendingUrl")
        });
        const providerReference = typeof preference.id === "string" ? preference.id : String(preference.id ?? payment.id);
        const withProvider: Payment = { ...payment, providerReference };
        const idempotencyKey =
          typeof body.idempotencyKey === "string"
            ? parseIdempotencyKey(body.idempotencyKey)
            : parseIdempotencyKey(`${payment.enrollmentId}:${providerReference}:mercadopago-checkout`);
        await repository.save(withProvider, idempotencyKey);
        return {
          paymentId: String(payment.id),
          provider: "mercadopago",
          providerReference,
          initPoint: preference.init_point,
          sandboxInitPoint: preference.sandbox_init_point,
          status: withProvider.status
        };
      }
    },
    {
      method: "POST",
      path: "/payments/manual",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        const payment: Payment = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(stringField(body, "tenantId")),
          enrollmentId: parseEntityId(stringField(body, "enrollmentId")),
          installmentId: typeof body.installmentId === "string" ? parseEntityId(body.installmentId) : null,
          amount: createMoney(stringField(body, "amount"), body.currency === "USD" ? "USD" : "PEN"),
          method: paymentMethod(body.method),
          status: "pendiente",
          providerReference: typeof body.providerReference === "string" ? body.providerReference : null,
          notes: typeof body.notes === "string" ? body.notes : "",
          paidAt: typeof body.paidAt === "string" ? body.paidAt : new Date().toISOString()
        };
        const idempotencyKey =
          typeof body.idempotencyKey === "string"
            ? parseIdempotencyKey(body.idempotencyKey)
            : parseIdempotencyKey(`${payment.enrollmentId}:${payment.amount.decimal}:${payment.providerReference ?? payment.id}`);
        return registerManualPayment.execute(payment, idempotencyKey, request.context);
      }
    },
    {
      method: "POST",
      path: "/payments/webhook/mercadopago",
      handler: async (request) => {
        const body = bodyAsRecord(request.body ?? {});

        // ── Verificación de firma HMAC-SHA256 ──────────────────────────────────
        // MercadoPago envía x-signature: "ts=<timestamp>,v1=<hmac_hex>"
        // El manifest es: "id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;"
        const data = typeof body.data === "object" && body.data !== null && !Array.isArray(body.data)
          ? body.data as Record<string, unknown>
          : {};
        const dataId = optionalString(data.id) ?? optionalString(body["data.id"]);
        const sigResult = verifyMercadoPagoWebhook({
          xSignature: request.headers["x-signature"],
          xRequestId: request.headers["x-request-id"],
          dataId,
          secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
          isProduction: process.env.NODE_ENV === "production" || process.env.APP_ENV === "production"
        });
        if (!sigResult.valid) {
          throw new BadRequestError(`Webhook signature invalid: ${sigResult.reason}`);
        }
        // ── Fin verificación de firma ──────────────────────────────────────────
        // `data` y `dataId` ya fueron parseados arriba para la verificación de firma
        const eventId = optionalString(body.id) ?? optionalString(body.action) ?? randomUUID();
        const providerPaymentId = dataId ?? optionalString(body.paymentId);
        await prisma.providerPaymentEvent.upsert({
          where: { provider_eventId: { provider: "mercadopago", eventId } },
          create: {
            id: randomUUID(),
            tenantId: request.context.tenantId === null ? null : String(request.context.tenantId),
            provider: "mercadopago",
            eventId,
            eventType: typeof body.type === "string" ? body.type : typeof body.action === "string" ? body.action : "payment.updated",
            payload: toJsonObject(body)
          },
          update: { payload: toJsonObject(body) }
        });
        if (providerPaymentId === null) return { received: true, processed: false, reason: "No provider payment id." };
        const providerPayment = await getMercadoPagoPayment(providerPaymentId);
        const externalReference = optionalString(providerPayment.external_reference);
        const tenantIdRaw = optionalString(objectPayload(providerPayment.metadata ?? {}).tenant_id);
        const tenantId = request.context.tenantId ?? (tenantIdRaw === null ? null : parseTenantId(tenantIdRaw));
        if (tenantId === null || externalReference === null) {
          return { received: true, processed: false, reason: "Missing tenant or external reference." };
        }
        const payment = await repository.findById(tenantId, parseEntityId(externalReference));
        if (payment === null) return { received: true, processed: false, reason: "Payment not found." };
        const providerStatus = optionalString(providerPayment.status);
        const nextStatus = providerStatus === "approved" ? "verificado" : providerStatus === "rejected" || providerStatus === "cancelled" ? "rechazado" : "pendiente";
        await repository.save({
          ...payment,
          status: nextStatus,
          providerReference: providerPaymentId,
          paidAt: nextStatus === "verificado" ? new Date().toISOString() : payment.paidAt,
          notes: nextStatus === "rechazado" ? `MercadoPago status: ${providerStatus ?? "unknown"}` : payment.notes
        });
        await prisma.providerPaymentEvent.update({
          where: { provider_eventId: { provider: "mercadopago", eventId } },
          data: { processedAt: new Date(), tenantId: String(tenantId) }
        });
        return { received: true, processed: true, paymentId: externalReference, status: nextStatus };
      }
    },
    {
      method: "POST",
      path: "/payments/verify",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        return verifyPayment.execute(parseEntityId(stringField(body, "paymentId")), request.context);
      }
    },
    {
      method: "POST",
      path: "/payments/reject",
      handler: async (request) => {
        const body = bodyAsRecord(request.body);
        return rejectPayment.execute({ paymentId: parseEntityId(stringField(body, "paymentId")), reason: stringField(body, "reason") }, request.context);
      }
    }
  ];
}
