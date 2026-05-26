/**
 * Tests de la verificación de firma HMAC-SHA256 del webhook de MercadoPago.
 *
 * Función pura — sin IO.
 *
 * Cómo correr:
 *   node --test --import tsx/esm src/tests/mercadopago-signature.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyMercadoPagoWebhook } from "../adapters/http/mercadopago-signature.js";

const SECRET     = "super-secret-webhook-key-32chars-min";
const DATA_ID    = "999999999";
const REQUEST_ID = "abc-def-ghi";
const TS         = "1704908747";

/** Genera una firma válida para los parámetros dados */
function makeValidSignature(params: {
  dataId?: string;
  requestId?: string;
  ts?: string;
  secret?: string;
}): string {
  const dId  = params.dataId    ?? DATA_ID;
  const rId  = params.requestId ?? REQUEST_ID;
  const ts   = params.ts        ?? TS;
  const sec  = params.secret    ?? SECRET;

  const parts: string[] = [];
  if (dId.length > 0)  parts.push(`id:${dId}`);
  if (rId.length > 0)  parts.push(`request-id:${rId}`);
  parts.push(`ts:${ts}`);

  const manifest = parts.join(";") + ";";
  const hmac = createHmac("sha256", sec).update(manifest, "utf-8").digest("hex");
  return `ts=${ts},v1=${hmac}`;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe("verifyMercadoPagoWebhook", () => {

  describe("Modo producción — sin secret configurado", () => {
    it("rechaza la solicitud si no hay secret en producción", () => {
      const result = verifyMercadoPagoWebhook({
        xSignature: makeValidSignature({}),
        xRequestId: REQUEST_ID,
        dataId:     DATA_ID,
        secret:     undefined,
        isProduction: true
      });
      assert.equal(result.valid, false);
      assert.ok(result.valid === false && result.reason.includes("MERCADOPAGO_WEBHOOK_SECRET"));
    });
  });

  describe("Modo desarrollo — sin secret configurado", () => {
    it("permite la solicitud (modo permisivo para desarrollo)", () => {
      const result = verifyMercadoPagoWebhook({
        xSignature: undefined,
        xRequestId: REQUEST_ID,
        dataId:     DATA_ID,
        secret:     undefined,
        isProduction: false
      });
      assert.equal(result.valid, true);
    });
  });

  describe("Con secret configurado", () => {
    it("acepta una firma válida", () => {
      const result = verifyMercadoPagoWebhook({
        xSignature:   makeValidSignature({}),
        xRequestId:   REQUEST_ID,
        dataId:       DATA_ID,
        secret:       SECRET,
        isProduction: true
      });
      assert.equal(result.valid, true);
    });

    it("rechaza cuando falta el header x-signature", () => {
      const result = verifyMercadoPagoWebhook({
        xSignature:   undefined,
        xRequestId:   REQUEST_ID,
        dataId:       DATA_ID,
        secret:       SECRET,
        isProduction: true
      });
      assert.equal(result.valid, false);
      assert.ok(result.valid === false && result.reason.includes("x-signature"));
    });

    it("rechaza un header x-signature malformado (sin ts ni v1)", () => {
      const result = verifyMercadoPagoWebhook({
        xSignature:   "algo=invalido",
        xRequestId:   REQUEST_ID,
        dataId:       DATA_ID,
        secret:       SECRET,
        isProduction: true
      });
      assert.equal(result.valid, false);
      assert.ok(result.valid === false && result.reason.includes("Malformed"));
    });

    it("rechaza una firma con el hash incorrecto", () => {
      const tampered = `ts=${TS},v1=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
      const result = verifyMercadoPagoWebhook({
        xSignature:   tampered,
        xRequestId:   REQUEST_ID,
        dataId:       DATA_ID,
        secret:       SECRET,
        isProduction: true
      });
      assert.equal(result.valid, false);
      assert.ok(result.valid === false && result.reason.includes("Signature"));
    });

    it("rechaza si el data.id fue alterado (ataque de replay)", () => {
      const validSig = makeValidSignature({});
      const result = verifyMercadoPagoWebhook({
        xSignature:   validSig,
        xRequestId:   REQUEST_ID,
        dataId:       "888888888",  // ← distinto al que se firmó
        secret:       SECRET,
        isProduction: true
      });
      assert.equal(result.valid, false);
    });

    it("rechaza si el secret es incorrecto", () => {
      const result = verifyMercadoPagoWebhook({
        xSignature:   makeValidSignature({ secret: "otro-secret-completamente-diferente" }),
        xRequestId:   REQUEST_ID,
        dataId:       DATA_ID,
        secret:       SECRET,
        isProduction: true
      });
      assert.equal(result.valid, false);
    });

    it("acepta x-signature con orden invertido (v1 antes de ts)", () => {
      const ts  = TS;
      const manifest = `id:${DATA_ID};request-id:${REQUEST_ID};ts:${ts};`;
      const hmac = createHmac("sha256", SECRET).update(manifest, "utf-8").digest("hex");
      // Orden inverso: v1 primero
      const invertedSig = `v1=${hmac},ts=${ts}`;

      const result = verifyMercadoPagoWebhook({
        xSignature:   invertedSig,
        xRequestId:   REQUEST_ID,
        dataId:       DATA_ID,
        secret:       SECRET,
        isProduction: true
      });
      assert.equal(result.valid, true);
    });

    it("acepta cuando x-signature es array (Node HTTP puede devolver array de headers)", () => {
      const sig = makeValidSignature({});
      const result = verifyMercadoPagoWebhook({
        xSignature:   [sig],
        xRequestId:   REQUEST_ID,
        dataId:       DATA_ID,
        secret:       SECRET,
        isProduction: true
      });
      assert.equal(result.valid, true);
    });
  });
});
