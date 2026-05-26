import { createHash, randomBytes, randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { NotFoundError, UnauthorizedError, parseEntityId, parseTenantId, toJsonObject } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Profile, ProfileRole } from "../../domain/profile.js";
import { computeLockoutExpiry, generateResetToken, hashPassword, isResetTokenExpired, verifyPassword } from "../../domain/password.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function role(value: unknown): ProfileRole {
  if (value === "superadmin" || value === "admin" || value === "viajero") return value;
  if (value === "usuario") return "viajero";
  return "viajero";
}

// hashPassword y verifyPassword vienen de ../../domain/password.js

function jwtSecret(): Uint8Array {
  const secret = process.env.APP_JWT_SECRET;
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("APP_JWT_SECRET must be configured with at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

function tokenTtlSeconds(): number {
  return Number(process.env.APP_JWT_ACCESS_SECONDS ?? "604800");
}

function refreshTokenTtlDays(): number {
  return Number(process.env.APP_JWT_REFRESH_DAYS ?? "30");
}

function hashRefreshToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf-8").digest("hex");
}

async function issueToken(profile: Profile): Promise<{ accessToken: string; expiresIn: number }> {
  const expiresIn = tokenTtlSeconds();
  let token = new SignJWT({
    email: profile.email,
    tenantId: profile.tenantId,
    app_role: profile.role,
    app_metadata: {
      tenant_id: profile.tenantId,
      role: profile.role
    }
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(profile.id))
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`);
  if (typeof process.env.APP_JWT_ISSUER === "string" && process.env.APP_JWT_ISSUER.length > 0) {
    token = token.setIssuer(process.env.APP_JWT_ISSUER);
  }
  const accessToken = await token.sign(jwtSecret());
  return { accessToken, expiresIn };
}

async function issueTokenPair(prisma: PrismaClient, profile: Profile, request: { readonly headers: Record<string, unknown> }): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}> {
  const token = await issueToken(profile);
  const refreshToken = randomBytes(48).toString("base64url");
  const refreshExpiresIn = refreshTokenTtlDays() * 24 * 60 * 60;
  await prisma.refreshTokenRecord.create({
    data: {
      id: randomUUID(),
      userId: String(profile.id),
      tenantId: profile.tenantId === null ? null : String(profile.tenantId),
      tokenHash: hashRefreshToken(refreshToken),
      userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : null,
      ipAddress: typeof request.headers["x-forwarded-for"] === "string" ? request.headers["x-forwarded-for"].split(",")[0]?.trim() ?? null : null,
      expiresAt: new Date(Date.now() + refreshExpiresIn * 1000)
    }
  });
  return { accessToken: token.accessToken, refreshToken, expiresIn: token.expiresIn, refreshExpiresIn };
}

function profileResponse(profile: Profile): Record<string, unknown> {
  return {
    id: String(profile.id),
    tenantId: profile.tenantId === null ? null : String(profile.tenantId),
    tenant_id: profile.tenantId === null ? null : String(profile.tenantId),
    email: profile.email,
    name: profile.name,
    role: profile.role,
    isActive: profile.isActive
  };
}

async function findProfileById(prisma: PrismaClient, userId: string): Promise<Profile | null> {
  const record = await prisma.profileRecord.findFirst({ where: { id: userId } });
  return record === null ? null : record.payload as Profile;
}

async function findProfileByEmail(prisma: PrismaClient, email: string): Promise<Profile | null> {
  const record = await prisma.profileRecord.findFirst({ where: { payload: { path: ["email"], equals: email } } });
  return record === null ? null : record.payload as Profile;
}

export function createIdentityAuthRoutes(prisma: PrismaClient): readonly Route[] {
  return [
    {
      method: "POST",
      path: "/identity/auth/register",
      handler: async (request) => {
        const body = record(request.body);
        const email = normalizeEmail(text(body, "email"));
        const password = text(body, "password");
        const accountRole = role(body.role ?? body.rol ?? body.tipoCuenta);
        if (accountRole === "superadmin") throw new Error("Superadmin accounts cannot be self-registered.");
        const tenantId = optionalText(body.tenantId ?? body.tenant_id);
        const profile: Profile = {
          id: parseEntityId(randomUUID()),
          tenantId: tenantId === null ? null : parseTenantId(tenantId),
          email,
          name: text(body, "name"),
          role: accountRole,
          isActive: true
        };

        await prisma.$transaction(async (tx) => {
          const existing = await tx.credentialRecord.findUnique({ where: { email } });
          if (existing !== null) throw new Error("Email is already registered.");
          await tx.profileRecord.create({
            data: {
              id: String(profile.id),
              tenantId: profile.tenantId === null ? null : String(profile.tenantId),
              status: "active",
              version: 1,
              payload: toJsonObject(profile)
            }
          });
          await tx.credentialRecord.create({
            data: {
              userId: String(profile.id),
              email,
              passwordHash: hashPassword(password)
            }
          });
        });

        const token = await issueTokenPair(prisma, profile, request);
        return {
          access_token: token.accessToken,
          refresh_token: token.refreshToken,
          token_type: "Bearer",
          expires_in: token.expiresIn,
          refresh_expires_in: token.refreshExpiresIn,
          user: profileResponse(profile)
        };
      }
    },
    {
      method: "POST",
      path: "/identity/auth/login",
      handler: async (request) => {
        const body = record(request.body);
        const email = normalizeEmail(text(body, "email"));
        const password = text(body, "password");
        const credential = await prisma.credentialRecord.findUnique({ where: { email } });
        if (credential === null || (credential.lockedUntil !== null && credential.lockedUntil > new Date())) {
          throw new UnauthorizedError("Invalid credentials.");
        }
        if (!verifyPassword(password, credential.passwordHash)) {
          const failedCount = credential.failedLoginCount + 1;
          await prisma.credentialRecord.update({
            where: { email },
            data: {
              failedLoginCount: failedCount,
              lockedUntil: computeLockoutExpiry(failedCount, new Date())
            }
          });
          throw new UnauthorizedError("Invalid credentials.");
        }

        const profile = await findProfileById(prisma, credential.userId);
        if (profile === null || !profile.isActive) throw new UnauthorizedError("Account is not active.");
        await prisma.credentialRecord.update({
          where: { email },
          data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() }
        });
        const token = await issueTokenPair(prisma, profile, request);
        return {
          access_token: token.accessToken,
          refresh_token: token.refreshToken,
          token_type: "Bearer",
          expires_in: token.expiresIn,
          refresh_expires_in: token.refreshExpiresIn,
          user: profileResponse(profile)
        };
      }
    },
    {
      method: "POST",
      path: "/identity/auth/refresh",
      handler: async (request) => {
        const body = record(request.body);
        const refreshToken = text(body, "refreshToken");
        const stored = await prisma.refreshTokenRecord.findUnique({ where: { tokenHash: hashRefreshToken(refreshToken) } });
        if (stored === null || stored.revokedAt !== null || stored.expiresAt <= new Date()) {
          throw new UnauthorizedError("Invalid refresh token.");
        }
        const profile = await findProfileById(prisma, stored.userId);
        if (profile === null || !profile.isActive) throw new UnauthorizedError("Account is not active.");
        const token = await prisma.$transaction(async (tx) => {
          await tx.refreshTokenRecord.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() }
          });
          return issueTokenPair(tx as unknown as PrismaClient, profile, request);
        });
        return {
          access_token: token.accessToken,
          refresh_token: token.refreshToken,
          token_type: "Bearer",
          expires_in: token.expiresIn,
          refresh_expires_in: token.refreshExpiresIn,
          user: profileResponse(profile)
        };
      }
    },
    {
      method: "GET",
      path: "/identity/auth/me",
      handler: async (request) => {
        if (request.context.userEmail === null) throw new UnauthorizedError("Authenticated user email is required.");
        const profile = await findProfileByEmail(prisma, normalizeEmail(request.context.userEmail));
        if (profile === null) throw new NotFoundError("Profile not found.");
        return profileResponse(profile);
      }
    },

    // ── Forgot password ──────────────────────────────────────────────────────
    {
      method: "POST",
      path: "/identity/auth/forgot-password",
      handler: async (request) => {
        const body = record(request.body);
        const email = normalizeEmail(text(body, "email"));

        // Comprobamos que la cuenta existe; si no, respondemos igual (no revelar existencia)
        const credential = await prisma.credentialRecord.findUnique({ where: { email } });

        if (credential !== null) {
          // Invalidar tokens de reset anteriores no usados para este email
          await prisma.passwordResetTokenRecord.updateMany({
            where: { email, usedAt: null },
            data: { usedAt: new Date() }
          });

          const { rawToken, tokenHash, expiresAt } = generateResetToken(new Date());
          await prisma.passwordResetTokenRecord.create({
            data: {
              id: randomUUID(),
              email,
              tokenHash,
              expiresAt
            }
          });

          // Notificación por email — integración opcional con Notifications service
          const notificationsUrl = process.env.NOTIFICATIONS_SERVICE_URL;
          if (typeof notificationsUrl === "string" && notificationsUrl.length > 0) {
            const secret = process.env.SERVICE_INTERNAL_SECRET;
            await fetch(`${notificationsUrl.replace(/\/$/, "")}/notifications/email/password-reset`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                ...(secret ? { "x-internal-service-secret": secret } : {}),
                "x-internal-user-role": "system"
              },
              body: JSON.stringify({ email, token: rawToken, expiresAt: expiresAt.toISOString() })
            }).catch(() => {
              // No lanzar si el servicio de notificaciones no está disponible
            });
          }
        }

        // Respuesta siempre 200 para no revelar si el email existe o no
        return { message: "If the email is registered, you will receive a reset link shortly." };
      }
    },

    // ── Reset password ───────────────────────────────────────────────────────
    {
      method: "POST",
      path: "/identity/auth/reset-password",
      handler: async (request) => {
        const body = record(request.body);
        const rawToken  = text(body, "token");
        const newPassword = text(body, "password");

        const tokenHash = createHash("sha256").update(rawToken, "utf-8").digest("hex");
        const resetRecord = await prisma.passwordResetTokenRecord.findUnique({ where: { tokenHash } });

        if (resetRecord === null || isResetTokenExpired(resetRecord, new Date())) {
          // Respuesta genérica para no revelar información
          throw new Error("Invalid or expired password reset token.");
        }

        await prisma.$transaction(async (tx) => {
          // Marcar el token como usado
          await tx.passwordResetTokenRecord.update({
            where: { id: resetRecord.id },
            data: { usedAt: new Date() }
          });
          // Actualizar credencial
          await tx.credentialRecord.update({
            where: { email: resetRecord.email },
            data: {
              passwordHash: hashPassword(newPassword),
              passwordUpdatedAt: new Date(),
              failedLoginCount: 0,
              lockedUntil: null
            }
          });
          // Revocar todos los refresh tokens activos por seguridad
          await tx.refreshTokenRecord.updateMany({
            where: { userId: (await tx.credentialRecord.findUnique({ where: { email: resetRecord.email } }))?.userId ?? "", revokedAt: null },
            data: { revokedAt: new Date() }
          });
        });

        return { message: "Password updated successfully. Please log in again." };
      }
    }
  ];
}
