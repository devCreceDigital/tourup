import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertActiveTenant, type Tenant, type TenantPreferences } from "../domain/tenant.js";

export interface TenantManagementRepository {
  findById(id: TenantId): Promise<Tenant | null>;
  findByDomain(domain: string): Promise<Tenant | null>;
  saveTenant(tenant: Tenant, idempotencyKey?: IdempotencyKey): Promise<void>;
  savePreferences(tenantId: TenantId, preferences: TenantPreferences, onboardingStep: number, onboardingCompleted: boolean): Promise<void>;
}

export class ResolveTenantByDomain {
  constructor(private readonly tenants: TenantManagementRepository) {}

  async execute(domain: string): Promise<Tenant> {
    const tenant = await this.tenants.findByDomain(domain);
    if (tenant === null) throw new Error("Tenant not found.");
    assertActiveTenant(tenant);
    return tenant;
  }
}

export class UpdateTenantPreferences {
  constructor(private readonly tenants: TenantManagementRepository) {}

  async execute(
    input: { preferences: TenantPreferences; onboardingStep: number; onboardingCompleted: boolean },
    context: TenantContext
  ): Promise<{ tenantId: TenantId; preferences: TenantPreferences }> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const tenant = await this.tenants.findById(tenantId);
    if (tenant === null) throw new Error("Tenant not found.");
    await this.tenants.savePreferences(tenantId, input.preferences, input.onboardingStep, input.onboardingCompleted);
    return { tenantId, preferences: input.preferences };
  }
}

export class CompleteTenantOnboarding {
  constructor(private readonly tenants: TenantManagementRepository) {}

  async execute(input: { planId: EntityId | null; preferences: TenantPreferences }, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<Tenant> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const existing = await this.tenants.findById(tenantId);
    if (existing === null) throw new Error("Tenant not found.");
    const completed: Tenant = { ...existing, planId: input.planId, preferences: input.preferences, status: "activo" };
    await this.tenants.saveTenant(completed, idempotencyKey);
    await this.tenants.savePreferences(tenantId, input.preferences, 100, true);
    return completed;
  }
}
