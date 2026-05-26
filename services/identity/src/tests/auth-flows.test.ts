/**
 * Tests de los handlers HTTP de los flows de email en identity.
 *
 * Cubre:
 *   - POST /identity/auth/forgot-password
 *   - POST /identity/auth/reset-password
 *   - POST /identity/auth/verify-email
 *   - POST /identity/auth/resend-verification
 *
 * Estrategia: mock PrismaClient con respuestas controladas.
 * Las funciones de dominio (tokens, hash) se invocan realmente — sin mock.
 *
 * Cómo correr:
 *   node --test --import tsx/esm src/tests/auth-flows.test.ts
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createIdentityAuthRoutes } from "../adapters/http/auth-routes.js";
import { generateEmailVerificationToken, generateResetToken } from "../domain/password.js";
import type { PrismaClient } from "../generated/prisma/client.js";

// ─── Helpers: Mock Prisma ─────────────────────────────────────────────────────

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/**
 * Crea un PrismaClient mock mínimo.
 * Cada método puede ser sobreescrito por opciones.
 */
function makeMockPrisma(overrides: DeepPartial<PrismaClient> = {}): PrismaClient {
  const base: DeepPartial<PrismaClient> = {
    credentialRecord: {
      findUnique: async () => null,
      update: async () => ({}) as never,
      create: async () => ({}) as never,
      updateMany: async () => ({}) as never
    } as never,
    profileRecord: {
      findFirst: async () => null,
      create: async () => ({}) as never,
      updateMany: async () => ({}) as never
    } as never,
    passwordResetTokenRecord: {
      findUnique: async () => null,
      create: async () => ({}) as never,
      update: async () => ({}) as never,
      updateMany: async () => ({}) as never
    } as never,
    emailVerificationRecord: {
      findUnique: async () => null,
      create: async () => ({}) as never,
      update: async () => ({}) as never,
      updateMany: async () => ({}) as never
    } as never,
    refreshTokenRecord: {
      create: async () => ({}) as never,
      updateMany: async () => ({}) as never,
      findUnique: async () => null
    } as never,
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(base)
  };
  // Merge superficial por tabla
  for (const key of Object.keys(overrides) as (keyof DeepPartial<PrismaClient>)[]) {
    (base as Record<string, unknown>)[key as string] = {
      ...(base as Record<string, unknown>)[key as string] as object,
      ...(overrides as Record<string, unknown>)[key as string] as object
    };
  }
  return base as unknown as PrismaClient;
}

/** Simula un request HTTP para los handlers. */
function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    path: "/test",
    params: {},
    query: new URLSearchParams(),
    body,
    headers: {
      "content-type": "application/json",
      ...headers
    },
    context: {
      tenantId: null,
      businessId: null,
      userId: null,
      userEmail: null,
      role: "anonymous" as const,
      requestId: "test-request-id",
      isPublic: false
    }
  };
}

/** Extrae el handler de una ruta por método + path. */
function getHandler(routes: ReturnType<typeof createIdentityAuthRoutes>, method: string, path: string) {
  const route = routes.find((r) => r.method === method && r.path === path);
  if (route === undefined) throw new Error(`Route not found: ${method} ${path}`);
  return route.handler;
}

/** Silencia sendInternalNotification — la URL no existe en tests. */
function withNoNotifications() {
  const saved = process.env.NOTIFICATIONS_SERVICE_URL;
  process.env.NOTIFICATIONS_SERVICE_URL = "";
  return () => { process.env.NOTIFICATIONS_SERVICE_URL = saved; };
}

// ─── Setup global ─────────────────────────────────────────────────────────────

beforeEach(() => {
  process.env.APP_JWT_SECRET = "test-jwt-secret-for-unit-tests-only-32";
  process.env.APP_ENV = "local";
  process.env.APP_URL = "http://localhost:3001";
  process.env.REQUIRE_EMAIL_VERIFICATION = "true";
});

// ─── POST /identity/auth/forgot-password ─────────────────────────────────────

describe("POST /identity/auth/forgot-password", () => {
  it("siempre retorna 200 aunque el email no exista (no revelar existencia)", async () => {
    const prisma = makeMockPrisma({
      credentialRecord: { findUnique: async () => null } as never
    });
    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/forgot-password");
    const restore = withNoNotifications();
    const result = await handler(makeRequest({ email: "no-existe@test.com" }));
    restore();
    assert.ok(typeof result === "object" && result !== null);
    assert.ok("message" in (result as object));
  });

  it("crea un token de reset cuando el email existe", async () => {
    let createdToken: unknown = null;

    const prisma = makeMockPrisma({
      credentialRecord: {
        findUnique: async () => ({ userId: "user-1", email: "real@test.com" }) as never
      } as never,
      passwordResetTokenRecord: {
        updateMany: async () => ({}) as never,
        create: async (args: { data: unknown }) => { createdToken = args.data; return {} as never; }
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/forgot-password");
    const restore = withNoNotifications();
    await handler(makeRequest({ email: "real@test.com" }));
    restore();

    assert.ok(createdToken !== null, "Debe haber creado un token de reset");
    const token = createdToken as { tokenHash: string; expiresAt: Date };
    assert.ok(typeof token.tokenHash === "string" && token.tokenHash.length === 64, "tokenHash debe ser SHA-256 (64 hex chars)");
    assert.ok(token.expiresAt instanceof Date, "expiresAt debe ser un Date");
    assert.ok(token.expiresAt > new Date(), "expiresAt debe ser en el futuro");
  });

  it("invalida tokens de reset anteriores antes de crear uno nuevo", async () => {
    let updateManyCalled = false;
    const prisma = makeMockPrisma({
      credentialRecord: {
        findUnique: async () => ({ userId: "u1", email: "user@test.com" }) as never
      } as never,
      passwordResetTokenRecord: {
        updateMany: async () => { updateManyCalled = true; return {} as never; },
        create: async () => ({}) as never
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/forgot-password");
    const restore = withNoNotifications();
    await handler(makeRequest({ email: "user@test.com" }));
    restore();

    assert.ok(updateManyCalled, "Debe invalidar tokens anteriores con updateMany");
  });

  it("retorna 422 si el email tiene formato inválido", async () => {
    const prisma = makeMockPrisma();
    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/forgot-password");

    await assert.rejects(
      () => handler(makeRequest({ email: "no-es-email" })),
      { message: /email|Must be a valid email/ }
    );
  });

  it("retorna 422 si el email está vacío", async () => {
    const prisma = makeMockPrisma();
    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/forgot-password");

    await assert.rejects(
      () => handler(makeRequest({ email: "" })),
      /email/
    );
  });
});

// ─── POST /identity/auth/reset-password ──────────────────────────────────────

describe("POST /identity/auth/reset-password", () => {
  it("resetea la contraseña con un token válido y retorna 200", async () => {
    const { rawToken, tokenHash, expiresAt } = generateResetToken(new Date());

    let passwordUpdated = false;
    let refreshTokensRevoked = false;

    const prisma = makeMockPrisma({
      passwordResetTokenRecord: {
        findUnique: async () => ({ id: "rt-1", email: "u@test.com", tokenHash, expiresAt, usedAt: null }) as never,
        update: async () => ({}) as never
      } as never,
      credentialRecord: {
        findUnique: async () => ({ userId: "user-1" }) as never,
        update: async () => { passwordUpdated = true; return {} as never; }
      } as never,
      refreshTokenRecord: {
        updateMany: async () => { refreshTokensRevoked = true; return {} as never; }
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/reset-password");
    const result = await handler(makeRequest({ token: rawToken, password: "NewPassword123!" }));

    assert.ok(passwordUpdated, "Debe actualizar la contraseña en credentialRecord");
    assert.ok(refreshTokensRevoked, "Debe revocar los refresh tokens activos");
    assert.ok(result !== null && typeof result === "object" && "message" in (result as object));
  });

  it("lanza error con token inexistente", async () => {
    const prisma = makeMockPrisma({
      passwordResetTokenRecord: {
        findUnique: async () => null
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/reset-password");

    await assert.rejects(
      () => handler(makeRequest({ token: "token-que-no-existe", password: "NewPass123!" })),
      /Invalid or expired/
    );
  });

  it("lanza error con token ya utilizado (usedAt !== null)", async () => {
    const { rawToken, tokenHash } = generateResetToken(new Date());
    const prisma = makeMockPrisma({
      passwordResetTokenRecord: {
        findUnique: async () => ({
          id: "rt-2",
          email: "u@test.com",
          tokenHash,
          expiresAt: new Date(Date.now() + 3_600_000),
          usedAt: new Date() // ya usado
        }) as never
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/reset-password");

    await assert.rejects(
      () => handler(makeRequest({ token: rawToken, password: "NewPass123!" })),
      /Invalid or expired/
    );
  });

  it("lanza error con token expirado (expiresAt en el pasado)", async () => {
    const { rawToken, tokenHash } = generateResetToken(new Date());
    const prisma = makeMockPrisma({
      passwordResetTokenRecord: {
        findUnique: async () => ({
          id: "rt-3",
          email: "u@test.com",
          tokenHash,
          expiresAt: new Date(Date.now() - 1), // ya expiró
          usedAt: null
        }) as never
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/reset-password");

    await assert.rejects(
      () => handler(makeRequest({ token: rawToken, password: "NewPass123!" })),
      /Invalid or expired/
    );
  });

  it("retorna 422 si la contraseña tiene menos de 8 caracteres", async () => {
    const { rawToken } = generateResetToken(new Date());
    const prisma = makeMockPrisma();
    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/reset-password");

    await assert.rejects(
      () => handler(makeRequest({ token: rawToken, password: "short" })),
      /8 characters/
    );
  });

  it("retorna 422 si falta el token", async () => {
    const prisma = makeMockPrisma();
    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/reset-password");

    await assert.rejects(
      () => handler(makeRequest({ password: "ValidPass123!" })),
      /token/
    );
  });
});

// ─── POST /identity/auth/verify-email ────────────────────────────────────────

describe("POST /identity/auth/verify-email", () => {
  it("verifica el email con un token válido y retorna 200", async () => {
    const { rawToken, tokenHash, expiresAt } = generateEmailVerificationToken(new Date());

    let profileUpdated = false;
    const prisma = makeMockPrisma({
      emailVerificationRecord: {
        findUnique: async () => ({ id: "ver-1", email: "u@test.com", tokenHash, expiresAt, usedAt: null }) as never,
        update: async () => ({}) as never
      } as never,
      profileRecord: {
        updateMany: async () => { profileUpdated = true; return {} as never; }
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/verify-email");
    const result = await handler(makeRequest({ token: rawToken }));

    assert.ok(profileUpdated, "Debe actualizar emailVerifiedAt en profileRecord");
    assert.ok(result !== null && typeof result === "object" && "message" in (result as object));
    assert.match((result as { message: string }).message, /verified/i);
  });

  it("lanza error con token inexistente", async () => {
    const prisma = makeMockPrisma({
      emailVerificationRecord: {
        findUnique: async () => null
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/verify-email");

    await assert.rejects(
      () => handler(makeRequest({ token: "token-invalido" })),
      /Invalid or expired/
    );
  });

  it("lanza error con token ya utilizado (usedAt !== null)", async () => {
    const { rawToken, tokenHash } = generateEmailVerificationToken(new Date());
    const prisma = makeMockPrisma({
      emailVerificationRecord: {
        findUnique: async () => ({
          id: "ver-2",
          email: "u@test.com",
          tokenHash,
          expiresAt: new Date(Date.now() + 86_400_000),
          usedAt: new Date() // ya usado
        }) as never
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/verify-email");

    await assert.rejects(
      () => handler(makeRequest({ token: rawToken })),
      /Invalid or expired/
    );
  });

  it("lanza error con token expirado (expiresAt en el pasado)", async () => {
    const { rawToken, tokenHash } = generateEmailVerificationToken(new Date());
    const prisma = makeMockPrisma({
      emailVerificationRecord: {
        findUnique: async () => ({
          id: "ver-3",
          email: "u@test.com",
          tokenHash,
          expiresAt: new Date(Date.now() - 1),
          usedAt: null
        }) as never
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/verify-email");

    await assert.rejects(
      () => handler(makeRequest({ token: rawToken })),
      /Invalid or expired/
    );
  });

  it("retorna 422 si falta el token", async () => {
    const prisma = makeMockPrisma();
    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/verify-email");

    await assert.rejects(
      () => handler(makeRequest({})),
      /token/
    );
  });
});

// ─── POST /identity/auth/resend-verification ─────────────────────────────────

describe("POST /identity/auth/resend-verification", () => {
  it("siempre retorna 200 aunque el email no esté pendiente (no revelar info)", async () => {
    const prisma = makeMockPrisma({
      profileRecord: {
        findFirst: async () => null // email no existe o ya verificado
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/resend-verification");
    const restore = withNoNotifications();
    const result = await handler(makeRequest({ email: "cualquiera@test.com" }));
    restore();

    assert.ok(result !== null && typeof result === "object" && "message" in (result as object));
  });

  it("crea un nuevo token de verificación para un email pendiente", async () => {
    let newTokenCreated = false;

    const prisma = makeMockPrisma({
      profileRecord: {
        findFirst: async () => ({
          id: "p-1",
          payload: { name: "Test User", email: "pending@test.com" },
          emailVerifiedAt: null
        }) as never
      } as never,
      emailVerificationRecord: {
        updateMany: async () => ({}) as never,
        create: async () => { newTokenCreated = true; return {} as never; }
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/resend-verification");
    const restore = withNoNotifications();
    await handler(makeRequest({ email: "pending@test.com" }));
    restore();

    assert.ok(newTokenCreated, "Debe crear un nuevo token de verificación");
  });

  it("invalida los tokens anteriores antes de crear uno nuevo", async () => {
    let updateManyCalled = false;

    const prisma = makeMockPrisma({
      profileRecord: {
        findFirst: async () => ({
          id: "p-2",
          payload: { name: "Test User", email: "pending2@test.com" },
          emailVerifiedAt: null
        }) as never
      } as never,
      emailVerificationRecord: {
        updateMany: async () => { updateManyCalled = true; return {} as never; },
        create: async () => ({}) as never
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/resend-verification");
    const restore = withNoNotifications();
    await handler(makeRequest({ email: "pending2@test.com" }));
    restore();

    assert.ok(updateManyCalled, "Debe invalidar tokens anteriores con updateMany");
  });

  it("retorna 422 si el email tiene formato inválido", async () => {
    const prisma = makeMockPrisma();
    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/resend-verification");

    await assert.rejects(
      () => handler(makeRequest({ email: "no-valido" })),
      /email|Must be a valid email/
    );
  });
});

// ─── Validación Zod en register ───────────────────────────────────────────────

describe("Validación Zod en handlers migrados", () => {
  it("forgot-password normaliza el email a minúsculas", async () => {
    let receivedEmail: string | null = null;

    const prisma = makeMockPrisma({
      credentialRecord: {
        findUnique: async (args: { where: { email: string } }) => {
          receivedEmail = args.where.email;
          return null;
        }
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/forgot-password");
    const restore = withNoNotifications();
    await handler(makeRequest({ email: "User@EXAMPLE.COM" }));
    restore();

    assert.equal(receivedEmail, "user@example.com", "emailSchema normaliza a minúsculas");
  });

  it("resend-verification normaliza el email a minúsculas", async () => {
    let receivedEmail: string | null = null;

    const prisma = makeMockPrisma({
      profileRecord: {
        findFirst: async (args: { where: { payload: { path: string[]; equals: string }; emailVerifiedAt: null } }) => {
          receivedEmail = args.where.payload.equals;
          return null;
        }
      } as never
    });

    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/resend-verification");
    const restore = withNoNotifications();
    await handler(makeRequest({ email: "UPPER@TEST.COM" }));
    restore();

    assert.equal(receivedEmail, "upper@test.com", "emailSchema normaliza a minúsculas");
  });

  it("reset-password rechaza contraseñas < 8 caracteres", async () => {
    const prisma = makeMockPrisma();
    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/reset-password");

    await assert.rejects(
      () => handler(makeRequest({ token: "valid-token", password: "short" })),
      /8 characters/
    );
  });

  it("forgot-password rechaza body no-objeto", async () => {
    const prisma = makeMockPrisma();
    const handler = getHandler(createIdentityAuthRoutes(prisma), "POST", "/identity/auth/forgot-password");

    await assert.rejects(
      () => handler(makeRequest("not an object")),
      /email/
    );
  });
});
