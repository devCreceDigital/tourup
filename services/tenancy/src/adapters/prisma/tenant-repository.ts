import type { PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import { publishOutboxEvent } from "@totem/service-runtime";
import type { EntityId, IdempotencyKey, TenantId } from "@totem/shared-kernel";
import { parseEntityId, parseTenantId } from "@totem/shared-kernel";
import type { TenantManagementRepository } from "../../application/tenant-use-cases.js";
import type { Tenant, TenantPreferences, TenantStatus } from "../../domain/tenant.js";

type TenantPayload = {
  id: string;
  name: string;
  domain: string;
  planId: string | null;
  status: TenantStatus;
};

function objectPayload(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Tenant payload is not an object.");
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${name} is invalid.`);
  return value.trim();
}

function nullableString(value: unknown, name: string): string | null {
  if (value === null) return null;
  return stringValue(value, name);
}

function tenantStatus(value: unknown): TenantStatus {
  if (value === "activo" || value === "cancelado" || value === "suspendido") return value;
  throw new Error("Tenant status is invalid.");
}

function jsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toTenant(payload: unknown, preferences: TenantPreferences): Tenant {
  const body = objectPayload(payload);
  const typed: TenantPayload = {
    id: stringValue(body.id, "id"),
    name: stringValue(body.name, "name"),
    domain: stringValue(body.domain, "domain"),
    planId: nullableString(body.planId, "planId"),
    status: tenantStatus(body.status)
  };
  return {
    id: parseEntityId(typed.id),
    name: typed.name,
    domain: typed.domain,
    planId: typed.planId === null ? null : parseEntityId(typed.planId),
    status: typed.status,
    preferences
  };
}

function defaultPreferences(): TenantPreferences {
  return {
    logoUrl: null,
    bannerUrl: null,
    primaryColor: "#0f766e",
    secondaryColor: "#1f2937",
    description: "",
    website: "",
    phone: "",
    ruc: "",
    slogan: "",
    customDomain: null,
    socialLinks: {},
    preferences: {},
    onboardingStep: 0,
    onboardingCompleted: false
  };
}

function toPreferences(record: {
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  website: string;
  phone: string;
  ruc: string;
  slogan: string;
  customDomain: string | null;
  socialLinks: unknown;
  preferences: unknown;
  onboardingStep: number;
  onboardingCompleted: boolean;
} | null): TenantPreferences {
  if (record === null) return defaultPreferences();
  return {
    logoUrl: record.logoUrl,
    bannerUrl: record.bannerUrl,
    primaryColor: record.primaryColor,
    secondaryColor: record.secondaryColor,
    description: record.description,
    website: record.website,
    phone: record.phone,
    ruc: record.ruc,
    slogan: record.slogan,
    customDomain: record.customDomain,
    socialLinks: jsonRecord(record.socialLinks),
    preferences: jsonRecord(record.preferences),
    onboardingStep: record.onboardingStep,
    onboardingCompleted: record.onboardingCompleted
  };
}

export class PrismaTenantManagementRepository implements TenantManagementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: TenantId): Promise<Tenant | null> {
    const [tenant, preferences] = await Promise.all([
      this.prisma.tenantRecord.findFirst({ where: { id: String(id) } }),
      this.prisma.tenantPreferenceRecord.findFirst({ where: { tenantId: String(id) } })
    ]);
    return tenant === null ? null : toTenant(tenant.payload, toPreferences(preferences));
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const preference = await this.prisma.tenantPreferenceRecord.findFirst({ where: { customDomain: domain } });
    const tenant = await this.prisma.tenantRecord.findFirst({
      where: preference === null ? { payload: { path: ["domain"], equals: domain } } : { id: preference.tenantId }
    });
    return tenant === null ? null : toTenant(tenant.payload, toPreferences(preference));
  }

  async saveTenant(tenant: Tenant, idempotencyKey?: IdempotencyKey): Promise<void> {
    const where = idempotencyKey === undefined ? { id: String(tenant.id) } : { idempotencyKey: String(idempotencyKey) };
    await this.prisma.tenantRecord.upsert({
      where,
      create: {
        id: String(tenant.id),
        tenantId: String(tenant.id),
        status: tenant.status,
        version: 1,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: {
          id: String(tenant.id),
          name: tenant.name,
          domain: tenant.domain,
          planId: tenant.planId === null ? null : String(tenant.planId),
          status: tenant.status
        }
      },
      update: {
        status: tenant.status,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey: String(idempotencyKey) }),
        payload: {
          id: String(tenant.id),
          name: tenant.name,
          domain: tenant.domain,
          planId: tenant.planId === null ? null : String(tenant.planId),
          status: tenant.status
        }
      }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(tenant.id),
      tenantId: parseTenantId(String(tenant.id)),
      eventType: `tenancy.tenant.${tenant.status}`,
      payload: { tenantId: String(tenant.id), name: tenant.name, domain: tenant.domain, status: tenant.status, planId: tenant.planId === null ? null : String(tenant.planId) }
    });
  }

  async savePreferences(tenantId: TenantId, preferences: TenantPreferences, onboardingStep: number, onboardingCompleted: boolean): Promise<void> {
    await this.prisma.tenantPreferenceRecord.upsert({
      where: { tenantId: String(tenantId) },
      create: {
        tenantId: String(tenantId),
        logoUrl: preferences.logoUrl,
        primaryColor: preferences.primaryColor,
        secondaryColor: preferences.secondaryColor,
        description: preferences.description,
        website: preferences.website,
        phone: preferences.phone,
        ruc: preferences.ruc,
        bannerUrl: preferences.bannerUrl,
        slogan: preferences.slogan,
        customDomain: preferences.customDomain,
        socialLinks: toJsonObject(preferences.socialLinks),
        preferences: toJsonObject(preferences.preferences),
        onboardingStep,
        onboardingCompleted
      },
      update: {
        logoUrl: preferences.logoUrl,
        primaryColor: preferences.primaryColor,
        secondaryColor: preferences.secondaryColor,
        description: preferences.description,
        website: preferences.website,
        phone: preferences.phone,
        ruc: preferences.ruc,
        bannerUrl: preferences.bannerUrl,
        slogan: preferences.slogan,
        customDomain: preferences.customDomain,
        socialLinks: toJsonObject(preferences.socialLinks),
        preferences: toJsonObject(preferences.preferences),
        onboardingStep,
        onboardingCompleted
      }
    });
    await publishOutboxEvent(this.prisma, {
      aggregateId: String(tenantId),
      tenantId,
      eventType: "tenancy.preferences.updated",
      payload: { tenantId: String(tenantId), onboardingStep, onboardingCompleted }
    });
  }
}
