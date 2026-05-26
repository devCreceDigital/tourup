import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Resultado de la verificación de firma de webhook MercadoPago.
 */
export type SignatureVerificationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Parsea el header x-signature de MercadoPago.
 *
 * Formato: "ts=1704908747,v1=618c85345248dd820d5fd456d..."
 * o el orden inverso: "v1=618c85...,ts=1704908747"
 */
function parseXSignature(header: string): { ts: string; v1: string } | null {
  const parts = header.split(",");
  let ts: string | null = null;
  let v1: string | null = null;
  for (const part of parts) {
    const [key, value] = part.trim().split("=");
    if (key === "ts" && typeof value === "string" && value.length > 0) ts = value;
    if (key === "v1" && typeof value === "string" && value.length > 0) v1 = value;
  }
  if (ts === null || v1 === null) return null;
  return { ts, v1 };
}

/**
 * Verifica la firma HMAC-SHA256 de una notificación webhook de MercadoPago.
 *
 * Documentación oficial:
 * https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks/introduction
 *
 * Algoritmo:
 *   manifest = "id:{dataId};request-id:{xRequestId};ts:{ts};"
 *   expected = HMAC-SHA256(key=secret, data=manifest)
 *   compare(expected, v1) con timingSafeEqual
 *
 * Si el secret no está configurado:
 *   - En producción: rechaza la solicitud (strict mode)
 *   - En desarrollo: permite con advertencia (permissive mode)
 */
export function verifyMercadoPagoWebhook(input: {
  readonly xSignature: string | string[] | undefined;
  readonly xRequestId: string | string[] | undefined;
  readonly dataId: string | null;
  readonly secret: string | undefined;
  readonly isProduction: boolean;
}): SignatureVerificationResult {
  const { xSignature, xRequestId, dataId, secret, isProduction } = input;

  // Sin secret configurado
  if (typeof secret !== "string" || secret.trim().length === 0) {
    if (isProduction) {
      return { valid: false, reason: "MERCADOPAGO_WEBHOOK_SECRET is required in production." };
    }
    // Dev: logea advertencia y permite pasar
    console.warn("[payments/webhook] MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature verification (development only).");
    return { valid: true };
  }

  // Header x-signature obligatorio
  if (xSignature === undefined) {
    return { valid: false, reason: "Missing x-signature header." };
  }
  const signatureHeader = Array.isArray(xSignature) ? xSignature[0] : xSignature;
  if (!signatureHeader) {
    return { valid: false, reason: "Missing x-signature header." };
  }

  const parsed = parseXSignature(signatureHeader);
  if (parsed === null) {
    return { valid: false, reason: "Malformed x-signature header." };
  }

  // Componer el manifest de verificación
  // Ref: https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks/introduction
  const requestId = Array.isArray(xRequestId)
    ? xRequestId[0] ?? ""
    : xRequestId ?? "";

  const manifestParts: string[] = [];
  if (dataId !== null && dataId.length > 0) {
    manifestParts.push(`id:${dataId}`);
  }
  if (requestId.length > 0) {
    manifestParts.push(`request-id:${requestId}`);
  }
  manifestParts.push(`ts:${parsed.ts}`);

  const manifest = manifestParts.join(";") + ";";

  // HMAC-SHA256
  const expectedHex = createHmac("sha256", secret.trim())
    .update(manifest, "utf-8")
    .digest("hex");

  try {
    const expectedBuf = Buffer.from(expectedHex, "hex");
    const actualBuf = Buffer.from(parsed.v1, "hex");
    if (expectedBuf.byteLength !== actualBuf.byteLength) {
      return { valid: false, reason: "Signature length mismatch." };
    }
    if (!timingSafeEqual(expectedBuf, actualBuf)) {
      return { valid: false, reason: "Signature verification failed." };
    }
  } catch {
    return { valid: false, reason: "Signature comparison error." };
  }

  return { valid: true };
}
