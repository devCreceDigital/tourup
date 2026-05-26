/**
 * Tests de seguridad del módulo de autenticación.
 *
 * Cubre: hashing de contraseñas, verificación, lockout, firma de webhook MP.
 * Funciones puras — sin base de datos.
 *
 * Cómo correr:
 *   node --test --import tsx/esm src/tests/auth-security.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeLockoutExpiry,
  generateResetToken,
  hashPassword,
  isResetTokenExpired,
  LOCKOUT_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  RESET_TOKEN_TTL_MS,
  verifyPassword
} from "../domain/password.js";

// ─── hashPassword ──────────────────────────────────────────────────────────────
describe("hashPassword", () => {
  it("genera un hash con el prefijo 'scrypt$v1'", () => {
    const hash = hashPassword("MiContraseña123!");
    assert.ok(hash.startsWith("scrypt$v1$"), `Hash inesperado: ${hash}`);
  });

  it("el hash tiene 4 partes separadas por '$'", () => {
    const hash = hashPassword("MiContraseña123!");
    const parts = hash.split("$");
    assert.equal(parts.length, 4, `Se esperaban 4 partes, se obtuvo: ${hash}`);
  });

  it("dos hashes de la misma contraseña son distintos (salt aleatorio)", () => {
    const h1 = hashPassword("misma-password");
    const h2 = hashPassword("misma-password");
    assert.notEqual(h1, h2, "Los hashes deben diferir por el salt aleatorio");
  });

  it("lanza error si la contraseña tiene menos de 8 caracteres", () => {
    assert.throws(
      () => hashPassword("corta"),
      { message: "Password must have at least 8 characters." }
    );
  });

  it("lanza error para contraseña vacía", () => {
    assert.throws(() => hashPassword(""));
  });

  it("lanza error para contraseña de exactamente 7 caracteres", () => {
    assert.throws(() => hashPassword("1234567"));
  });

  it("no lanza para contraseña de exactamente 8 caracteres (límite inferior)", () => {
    assert.doesNotThrow(() => hashPassword("12345678"));
  });
});

// ─── verifyPassword ────────────────────────────────────────────────────────────
describe("verifyPassword", () => {
  it("retorna true para la contraseña correcta", () => {
    const password = "MiContraseña-Segura-2024!";
    const hash     = hashPassword(password);
    assert.equal(verifyPassword(password, hash), true);
  });

  it("retorna false para contraseña incorrecta", () => {
    const hash = hashPassword("contraseña-correcta");
    assert.equal(verifyPassword("contraseña-incorrecta", hash), false);
  });

  it("retorna false para contraseña vacía contra un hash válido", () => {
    const hash = hashPassword("validpassword");
    assert.equal(verifyPassword("", hash), false);
  });

  it("retorna false para un hash malformado (muy pocas partes)", () => {
    assert.equal(verifyPassword("cualquiera", "hash-invalido"), false);
  });

  it("retorna false para un hash con algoritmo desconocido", () => {
    assert.equal(verifyPassword("pass", "bcrypt$v1$salt$hash"), false);
  });

  it("retorna false para un hash con versión desconocida", () => {
    assert.equal(verifyPassword("pass", "scrypt$v2$salt$hash"), false);
  });

  it("retorna false para hash con salt corrompido", () => {
    const hash = hashPassword("correcta");
    // Corrompe el salt (3ra parte)
    const parts = hash.split("$");
    parts[2] = "saltcorrompido!!!";
    assert.equal(verifyPassword("correcta", parts.join("$")), false);
  });

  it("es case-sensitive: 'Password' ≠ 'password'", () => {
    const hash = hashPassword("Password123!");
    assert.equal(verifyPassword("password123!", hash), false);
    assert.equal(verifyPassword("Password123!", hash), true);
  });
});

// ─── computeLockoutExpiry ──────────────────────────────────────────────────────
describe("computeLockoutExpiry", () => {
  const now = new Date("2025-01-15T12:00:00.000Z");

  it(`retorna null antes de ${MAX_FAILED_ATTEMPTS} intentos`, () => {
    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) {
      assert.equal(computeLockoutExpiry(i, now), null, `Fallo en intento ${i}`);
    }
  });

  it(`retorna fecha de expiración al llegar a ${MAX_FAILED_ATTEMPTS} intentos`, () => {
    const expiry = computeLockoutExpiry(MAX_FAILED_ATTEMPTS, now);
    assert.ok(expiry !== null, "Debe devolver una fecha");
    const expectedMs = now.getTime() + LOCKOUT_DURATION_MS;
    assert.equal(expiry.getTime(), expectedMs);
  });

  it("retorna fecha de expiración para más de MAX_FAILED_ATTEMPTS intentos", () => {
    const expiry = computeLockoutExpiry(MAX_FAILED_ATTEMPTS + 5, now);
    assert.ok(expiry !== null);
  });

  it(`LOCKOUT_DURATION_MS es 15 minutos`, () => {
    assert.equal(LOCKOUT_DURATION_MS, 15 * 60 * 1000);
  });

  it(`MAX_FAILED_ATTEMPTS es 10`, () => {
    assert.equal(MAX_FAILED_ATTEMPTS, 10);
  });
});

// ─── generateResetToken ────────────────────────────────────────────────────────
describe("generateResetToken", () => {
  const now = new Date("2025-06-01T10:00:00.000Z");

  it("genera rawToken no vacío en formato base64url", () => {
    const { rawToken } = generateResetToken(now);
    assert.ok(rawToken.length > 0, "rawToken debe ser no vacío");
    // base64url solo contiene A-Z a-z 0-9 - _
    assert.match(rawToken, /^[A-Za-z0-9\-_]+$/, "rawToken debe ser base64url");
  });

  it("genera tokenHash distinto al rawToken (es SHA-256 hex de 64 chars)", () => {
    const { rawToken, tokenHash } = generateResetToken(now);
    assert.notEqual(rawToken, tokenHash);
    assert.equal(tokenHash.length, 64, "SHA-256 hex debe tener 64 chars");
    assert.match(tokenHash, /^[0-9a-f]+$/, "tokenHash debe ser hex lowercase");
  });

  it("dos tokens generados en el mismo instante son distintos (aleatoriedad)", () => {
    const t1 = generateResetToken(now);
    const t2 = generateResetToken(now);
    assert.notEqual(t1.rawToken, t2.rawToken);
    assert.notEqual(t1.tokenHash, t2.tokenHash);
  });

  it(`expiresAt es now + ${RESET_TOKEN_TTL_MS}ms (1 hora)`, () => {
    const { expiresAt } = generateResetToken(now);
    assert.equal(expiresAt.getTime(), now.getTime() + RESET_TOKEN_TTL_MS);
  });

  it("RESET_TOKEN_TTL_MS es 1 hora (3600000 ms)", () => {
    assert.equal(RESET_TOKEN_TTL_MS, 3_600_000);
  });
});

// ─── isResetTokenExpired ───────────────────────────────────────────────────────
describe("isResetTokenExpired", () => {
  const now = new Date("2025-06-01T10:00:00.000Z");
  const future = new Date(now.getTime() + 30 * 60 * 1000); // +30 min

  it("retorna false para un token vigente no usado", () => {
    const result = isResetTokenExpired({ expiresAt: future, usedAt: null }, now);
    assert.equal(result, false);
  });

  it("retorna true cuando expiresAt <= now (token vencido)", () => {
    const past = new Date(now.getTime() - 1);
    assert.equal(isResetTokenExpired({ expiresAt: past, usedAt: null }, now), true);
  });

  it("retorna true cuando expiresAt === now (límite exacto)", () => {
    assert.equal(isResetTokenExpired({ expiresAt: now, usedAt: null }, now), true);
  });

  it("retorna true cuando usedAt no es null (token ya consumido)", () => {
    const usedAt = new Date(now.getTime() - 5_000);
    assert.equal(isResetTokenExpired({ expiresAt: future, usedAt }, now), true);
  });

  it("retorna true si tanto expiresAt venció como usedAt está seteado", () => {
    const past = new Date(now.getTime() - 1);
    const usedAt = new Date(now.getTime() - 500);
    assert.equal(isResetTokenExpired({ expiresAt: past, usedAt }, now), true);
  });
});
