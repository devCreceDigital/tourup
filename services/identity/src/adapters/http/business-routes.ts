import { createHash, randomBytes, randomUUID, scryptSync } from "node:crypto";
import { assertAdmin, parseEntityId, parseIdempotencyKey, parseTenantId, toJsonObject } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { GetProfileByEmail, InviteUser, type ProfileRepository } from "../../application/profile-use-cases.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Profile, ProfileRole, UserInvitation } from "../../domain/profile.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }
  return value.trim();
}

function invitationRole(value: string): Exclude<ProfileRole, "superadmin"> {
  if (value === "admin" || value === "viajero") {
    return value;
  }
  throw new Error("Invalid invitation role.");
}

function tokenHashFromRawToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf-8").digest("hex");
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function createInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashPassword(password: string): string {
  if (password.length < 8) throw new Error("Password must have at least 8 characters.");
  const salt = randomBytes(24).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$v1$${salt}$${hash}`;
}

function profileFromPayload(payload: unknown): Profile {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new Error("Profile payload is invalid.");
  return payload as Profile;
}

export function createIdentityBusinessRoutes(repository: ProfileRepository, prisma: PrismaClient): readonly Route[] {
  const getProfileByEmail = new GetProfileByEmail(repository);
  const inviteUser = new InviteUser(repository);

  return [
    {
      method: "GET",
      path: "/identity/profile/me",
      handler: async (request) => {
        const email = request.context.userEmail;
        if (typeof email !== "string" || email.trim().length === 0) {
          throw new Error("Authenticated user email is required.");
        }
        return getProfileByEmail.execute(email.trim().toLowerCase(), request.context);
      }
    },
    {
      method: "POST",
      path: "/identity/profile/by-email",
      handler: async (request) => getProfileByEmail.execute(text(record(request.body), "email"), request.context)
    },
    {
      method: "POST",
      path: "/identity/invitations",
      handler: async (request) => {
        const body = record(request.body);
        const providedToken = optionalText(body.rawInvitationToken);
        const rawInvitationToken = providedToken ?? createInvitationToken();
        const invitation: UserInvitation = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(text(body, "tenantId")),
          email: text(body, "email").toLowerCase(),
          role: invitationRole(text(body, "role")),
          tokenHash: tokenHashFromRawToken(rawInvitationToken),
          status: "pendiente",
          expiresAt: text(body, "expiresAt")
        };
        const idempotencyKey =
          typeof body.idempotencyKey === "string"
            ? parseIdempotencyKey(body.idempotencyKey)
            : parseIdempotencyKey(`${invitation.tenantId}:${invitation.email}:identity-invitation`);
        if (providedToken === null) {
          const existing = await prisma.invitationRecord.findUnique({ where: { idempotencyKey: String(idempotencyKey) } });
          if (existing !== null) {
            return {
              id: existing.id,
              tenantId: existing.tenantId,
              email: existing.email,
              role: existing.role,
              status: existing.status,
              expiresAt: existing.expiresAt.toISOString(),
              rawInvitationToken: null
            };
          }
        }
        const saved = await inviteUser.execute(invitation, idempotencyKey, request.context);
        return { ...saved, rawInvitationToken };
      }
    },
    {
      method: "POST",
      path: "/identity/invitations/accept",
      handler: async (request) => {
        const body = record(request.body);
        const rawInvitationToken = text(body, "rawInvitationToken");
        const password = text(body, "password");
        const name = text(body, "name");
        const invitation = await prisma.invitationRecord.findUnique({ where: { tokenHash: tokenHashFromRawToken(rawInvitationToken) } });
        if (invitation === null || invitation.status !== "pendiente" || invitation.expiresAt <= new Date()) {
          throw new Error("Invitation is invalid or expired.");
        }
        const id = parseEntityId(randomUUID());
        const profile: Profile = {
          id,
          tenantId: parseTenantId(invitation.tenantId),
          email: invitation.email,
          name,
          role: invitationRole(invitation.role),
          isActive: true
        };
        await prisma.$transaction(async (tx) => {
          const existing = await tx.credentialRecord.findUnique({ where: { email: invitation.email } });
          if (existing !== null) throw new Error("Email is already registered.");
          await tx.profileRecord.create({
            data: {
              id: String(id),
              tenantId: invitation.tenantId,
              status: "active",
              version: 1,
              payload: toJsonObject(profile)
            }
          });
          await tx.credentialRecord.create({
            data: {
              userId: String(id),
              email: invitation.email,
              passwordHash: hashPassword(password)
            }
          });
          await tx.invitationRecord.update({
            where: { id: invitation.id },
            data: { status: "aceptada", acceptedAt: new Date() }
          });
        });
        return { id: String(profile.id), tenantId: String(profile.tenantId), email: profile.email, role: profile.role, isActive: profile.isActive };
      }
    },
    {
      method: "GET",
      path: "/identity/tenant/users",
      handler: async (request) => {
        assertAdmin(request.context);
        const tenantId = request.context.tenantId ?? parseTenantId(text(Object.fromEntries(request.query), "tenantId"));
        const users = await prisma.profileRecord.findMany({
          where: { tenantId: String(tenantId) },
          orderBy: { createdAt: "asc" }
        });
        return {
          tenantId: String(tenantId),
          users: users.map((user) => {
            const profile = profileFromPayload(user.payload);
            return { id: String(profile.id), email: profile.email, name: profile.name, role: profile.role, isActive: profile.isActive };
          })
        };
      }
    },
    {
      method: "POST",
      path: "/identity/profile/change-role",
      handler: async (request) => {
        assertAdmin(request.context);
        const body = record(request.body);
        const userId = text(body, "userId");
        const nextRole = invitationRole(text(body, "role"));
        const existing = await prisma.profileRecord.findFirst({ where: { id: userId } });
        if (existing === null) throw new Error("Profile not found.");
        const profile = profileFromPayload(existing.payload);
        if (request.context.role !== "superadmin" && profile.tenantId !== request.context.tenantId) {
          throw new Error("Tenant scope mismatch.");
        }
        const updated: Profile = { ...profile, role: nextRole };
        await prisma.profileRecord.update({
          where: { id: userId },
          data: { payload: toJsonObject(updated) }
        });
        return { id: userId, role: nextRole };
      }
    }
  ];
}
