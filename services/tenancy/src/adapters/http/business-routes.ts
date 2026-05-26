import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId, requireTenant } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { CompleteTenantOnboarding, ResolveTenantByDomain, UpdateTenantPreferences, type TenantManagementRepository } from "../../application/tenant-use-cases.js";
import type { Tenant, TenantPreferences } from "../../domain/tenant.js";

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

function intValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function slug(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return normalized.length > 0 ? normalized : `tenant-${randomUUID().slice(0, 8)}`;
}

function preferences(body: Record<string, unknown>): TenantPreferences {
  return {
    logoUrl: optionalText(body.logoUrl),
    bannerUrl: optionalText(body.bannerUrl) ?? optionalText(jsonObject(body.preferences).bannerUrl),
    primaryColor: typeof body.primaryColor === "string" ? body.primaryColor : "#0f766e",
    secondaryColor: typeof body.secondaryColor === "string" ? body.secondaryColor : "#1f2937",
    description: typeof body.description === "string" ? body.description : "",
    website: typeof body.website === "string" ? body.website : "",
    phone: typeof body.phone === "string" ? body.phone : "",
    ruc: typeof body.ruc === "string" ? body.ruc : "",
    slogan: typeof body.slogan === "string" ? body.slogan : "",
    customDomain: optionalText(body.customDomain) ?? optionalText(jsonObject(body.preferences).customDomain),
    socialLinks: jsonObject(body.socialLinks),
    preferences: jsonObject(body.preferences),
    onboardingStep: intValue(body.onboardingStep, 0),
    onboardingCompleted: body.onboardingCompleted === true
  };
}

function publicTenantView(tenant: Awaited<ReturnType<TenantManagementRepository["findById"]>> extends infer T ? NonNullable<T> : never) {
  return {
    id: String(tenant.id),
    tenantId: String(tenant.id),
    name: tenant.name,
    domain: tenant.domain,
    planId: tenant.planId === null ? null : String(tenant.planId),
    status: tenant.status,
    preferences: tenant.preferences,
    logoUrl: tenant.preferences.logoUrl,
    bannerUrl: tenant.preferences.bannerUrl,
    primaryColor: tenant.preferences.primaryColor,
    secondaryColor: tenant.preferences.secondaryColor,
    description: tenant.preferences.description,
    website: tenant.preferences.website,
    phone: tenant.preferences.phone,
    slogan: tenant.preferences.slogan,
    customDomain: tenant.preferences.customDomain,
    socialLinks: tenant.preferences.socialLinks,
    onboardingStep: tenant.preferences.onboardingStep,
    onboardingCompleted: tenant.preferences.onboardingCompleted
  };
}

export function createTenancyBusinessRoutes(repository: TenantManagementRepository): readonly Route[] {
  const resolveTenant = new ResolveTenantByDomain(repository);
  const updatePreferences = new UpdateTenantPreferences(repository);
  const completeOnboarding = new CompleteTenantOnboarding(repository);

  return [
    {
      method: "POST",
      path: "/tenancy/onboarding/start",
      handler: async (request) => {
        const body = record(request.body);
        const id = typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID());
        const name = text(body, "name");
        const domain = typeof body.domain === "string" && body.domain.trim().length > 0 ? slug(body.domain) : slug(name);
        const planId = typeof body.planId === "string" ? parseEntityId(body.planId) : null;
        const idempotencyKey =
          typeof body.idempotencyKey === "string"
            ? parseIdempotencyKey(body.idempotencyKey)
            : parseIdempotencyKey(`tenant-onboarding-${id}`);
        const tenant: Tenant = {
          id,
          name,
          domain,
          planId,
          status: "activo",
          preferences: preferences(body)
        };
        await repository.saveTenant(tenant, idempotencyKey);
        await repository.savePreferences(parseTenantId(String(id)), tenant.preferences, tenant.preferences.onboardingStep, tenant.preferences.onboardingCompleted);
        return publicTenantView(tenant);
      }
    },
    {
      method: "POST",
      path: "/tenancy/resolve",
      handler: async (request) => resolveTenant.execute(text(record(request.body), "domain"))
    },
    {
      method: "GET",
      path: "/tenancy/public/:domain",
      handler: async (request) => {
        const domain = request.params.domain ?? "";
        if (domain.trim().length === 0) throw new Error("domain is required.");
        const tenant = await resolveTenant.execute(domain.trim());
        return publicTenantView(tenant);
      }
    },
    {
      method: "GET",
      path: "/tenancy/public/tenant/:tenantId",
      handler: async (request) => {
        const tenantId = request.params.tenantId ?? "";
        if (tenantId.trim().length === 0) throw new Error("tenantId is required.");
        const tenant = await repository.findById(parseTenantId(tenantId.trim()));
        if (tenant === null) throw new Error("Tenant not found.");
        return publicTenantView(tenant);
      }
    },
    {
      method: "GET",
      path: "/tenancy/preferences",
      handler: async (request) => {
        const tenantId = requireTenant(request.context);
        const tenant = await repository.findById(tenantId);
        if (tenant === null) throw new Error("Tenant not found.");
        return publicTenantView(tenant);
      }
    },
    {
      method: "POST",
      path: "/tenancy/preferences",
      handler: async (request) => {
        const body = record(request.body);
        const nextPreferences = preferences(body);
        return updatePreferences.execute(
          {
            preferences: nextPreferences,
            onboardingStep: nextPreferences.onboardingStep,
            onboardingCompleted: nextPreferences.onboardingCompleted
          },
          request.context
        );
      }
    },
    {
      method: "POST",
      path: "/tenancy/onboarding/complete",
      handler: async (request) => {
        const body = record(request.body);
        const idempotencyKey =
          typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${request.context.tenantId}:tenant-onboarding-complete`);
        return completeOnboarding.execute(
          {
            planId: typeof body.planId === "string" ? parseEntityId(body.planId) : null,
            preferences: preferences(body)
          },
          idempotencyKey,
          request.context
        );
      }
    }
  ];
}
