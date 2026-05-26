import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT } from "jose";
import { parseEntityId, parseTenantId, toJsonObject } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Profile, ProfileRole } from "../../domain/profile.js";

const passwordKeyLength = 64;

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

function hashPassword(password: string): string {
  if (password.length < 8) throw new Error("Password must have at least 8 characters.");
  const salt = randomBytes(24).toString("base64url");
  const hash = scryptSync(password, salt, passwordKeyLength).toString("base64url");
  return `scrypt$v1$${salt}$${hash}`;
}

function verifyPassword(password: string, encoded: string): boolean {
  const [algorithm, version, salt, expected] = encoded.split("$");
  if (algorithm !== "scrypt" || version !== "v1" || salt === undefined || expected === undefined) return false;
  const actual = scryptSync(password, salt, passwordKeyLength);
  const expectedBuffer = Buffer.from(expected, "base64url");
  return actual.byteLength === expectedBuffer.byteLength && timingSafeEqual(actual, expectedBuffer);
}

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
          throw new Error("Invalid credentials.");
        }
        if (!verifyPassword(password, credential.passwordHash)) {
          const failedLoginCount = credential.failedLoginCount + 1;
          await prisma.credentialRecord.update({
            where: { email },
            data: {
              failedLoginCount,
              lockedUntil: failedLoginCount >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null
            }
          });
          throw new Error("Invalid credentials.");
        }

        const profile = await findProfileById(prisma, credential.userId);
        if (profile === null || !profile.isActive) throw new Error("Profile is not active.");
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
          throw new Error("Invalid refresh token.");
        }
        const profile = await findProfileById(prisma, stored.userId);
        if (profile === null || !profile.isActive) throw new Error("Profile is not active.");
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
        if (request.context.userEmail === null) throw new Error("Authenticated user email is required.");
        const profile = await findProfileByEmail(prisma, normalizeEmail(request.context.userEmail));
        if (profile === null) throw new Error("Profile not found.");
        return profileResponse(profile);
      }
    }
  ];
}
