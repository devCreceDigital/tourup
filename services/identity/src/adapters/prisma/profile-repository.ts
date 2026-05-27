import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { EntityId, IdempotencyKey } from "@totem/shared-kernel";
import type { ProfileRepository } from "../../application/profile-use-cases.js";
import type { Profile, UserInvitation } from "../../domain/profile.js";

function asProfile(payload: unknown): Profile {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new Error("Profile payload is not an object.");
  return payload as Profile;
}

export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<Profile | null> {
    const record = await this.prisma.profileRecord.findFirst({ where: { payload: { path: ["email"], equals: email } } });
    return record === null ? null : asProfile(record.payload);
  }

  async findById(id: EntityId): Promise<Profile | null> {
    const record = await this.prisma.profileRecord.findFirst({ where: { id: String(id) } });
    return record === null ? null : asProfile(record.payload);
  }

  async saveProfile(profile: Profile, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(profile.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.profileRecord.upsert({
      where,
      create: {
        id: String(profile.id),
        tenantId: profile.tenantId === null ? null : String(profile.tenantId),
        status: profile.isActive ? "active" : "inactive",
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: toJsonObject(profile)
      },
      update: {
        tenantId: profile.tenantId === null ? null : String(profile.tenantId),
        status: profile.isActive ? "active" : "inactive",
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: toJsonObject(profile)
      }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(profile.id),
      tenantId: profile.tenantId,
      eventType: `identity.profile.${profile.isActive ? "active" : "inactive"}`,
      payload: { profileId: String(profile.id), email: profile.email, role: profile.role, isActive: profile.isActive }
    });
  }

  async saveInvitation(invitation: UserInvitation, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where =
      idempotencyKey === undefined
        ? { tokenHash: invitation.tokenHash }
        : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.invitationRecord.upsert({
      where,
      create: {
        id: String(invitation.id),
        tenantId: String(invitation.tenantId),
        email: invitation.email,
        role: invitation.role,
        tokenHash: invitation.tokenHash,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        status: invitation.status,
        createdBy: null,
        expiresAt: invitation.expiresAt
      },
      update: {
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        status: invitation.status,
        acceptedAt: invitation.status === "aceptada" ? new Date() : null
      }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(invitation.id),
      tenantId: invitation.tenantId,
      eventType: `identity.invitation.${invitation.status}`,
      payload: { invitationId: String(invitation.id), email: invitation.email, role: invitation.role, status: invitation.status }
    });
  }
}
