from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def add_catalog() -> None:
    base = ROOT / "services" / "catalog" / "src"
    write(
        base / "domain" / "catalog-item.ts",
        """import type { EntityId, Money, TenantId } from "@totem/shared-kernel";

export type CatalogScope = "global" | "tenant";
export type CatalogItemKind = "destino" | "actividad" | "alojamiento" | "complemento";
export type CatalogItemStatus = "borrador" | "publicado" | "archivado";

export type CatalogItem = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly scope: CatalogScope;
  readonly kind: CatalogItemKind;
  readonly name: string;
  readonly description: string;
  readonly location: string | null;
  readonly priceFrom: Money | null;
  readonly status: CatalogItemStatus;
  readonly metadata: Record<string, unknown>;
};

export function assertCatalogOwnership(item: CatalogItem): void {
  if (item.scope === "tenant" && item.tenantId === null) {
    throw new Error("Tenant-scoped catalog item requires tenant id.");
  }
  if (item.scope === "global" && item.tenantId !== null) {
    throw new Error("Global catalog item cannot be owned by a tenant.");
  }
}

export function assertPublishableCatalogItem(item: CatalogItem): void {
  assertCatalogOwnership(item);
  if (item.name.trim().length === 0) {
    throw new Error("Catalog item requires name.");
  }
}""",
    )
    write(
        base / "application" / "catalog-use-cases.ts",
        """import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertCatalogOwnership, assertPublishableCatalogItem, type CatalogItem, type CatalogItemKind } from "../domain/catalog-item.js";

export interface CatalogRepository {
  findById(id: EntityId, tenantId: TenantId | null): Promise<CatalogItem | null>;
  listVisible(tenantId: TenantId | null, kind: CatalogItemKind | null): Promise<readonly CatalogItem[]>;
  save(item: CatalogItem, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class CreateCatalogItem {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(item: CatalogItem, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<CatalogItem> {
    assertAdmin(context);
    if (item.scope === "tenant") {
      const tenantId = requireTenant(context);
      const tenantItem = { ...item, tenantId };
      assertCatalogOwnership(tenantItem);
      await this.catalog.save(tenantItem, idempotencyKey);
      return tenantItem;
    }
    assertCatalogOwnership(item);
    await this.catalog.save(item, idempotencyKey);
    return item;
  }
}

export class PublishCatalogItem {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(id: EntityId, context: TenantContext): Promise<CatalogItem> {
    assertAdmin(context);
    const tenantId = context.role === "superadmin" ? null : requireTenant(context);
    const item = await this.catalog.findById(id, tenantId);
    if (item === null) {
      throw new Error("Catalog item not found.");
    }
    assertPublishableCatalogItem(item);
    const published: CatalogItem = { ...item, status: "publicado" };
    await this.catalog.save(published);
    return published;
  }
}""",
    )


def add_itineraries() -> None:
    base = ROOT / "services" / "itineraries" / "src"
    write(
        base / "domain" / "itinerary.ts",
        """import type { EntityId, TenantId } from "@totem/shared-kernel";

export type ItineraryStatus = "borrador" | "activo" | "archivado";

export type ItineraryEvent = {
  readonly id: EntityId;
  readonly type: "traslado" | "actividad" | "comida" | "alojamiento" | "libre" | "otro";
  readonly description: string;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly order: number;
  readonly activityId: EntityId | null;
};

export type ItineraryDay = {
  readonly id: EntityId;
  readonly dayNumber: number;
  readonly title: string;
  readonly summary: string;
  readonly overnightAccommodation: string | null;
  readonly destinationName: string | null;
  readonly events: readonly ItineraryEvent[];
};

export type Itinerary = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly description: string;
  readonly version: number;
  readonly status: ItineraryStatus;
  readonly days: readonly ItineraryDay[];
};

export function assertValidItinerary(itinerary: Itinerary): void {
  const dayNumbers = new Set<number>();
  for (const day of itinerary.days) {
    if (day.dayNumber < 1) {
      throw new Error("Itinerary day number must be positive.");
    }
    if (dayNumbers.has(day.dayNumber)) {
      throw new Error("Itinerary day numbers must be unique.");
    }
    dayNumbers.add(day.dayNumber);
  }
}""",
    )
    write(
        base / "application" / "itinerary-use-cases.ts",
        """import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertValidItinerary, type Itinerary } from "../domain/itinerary.js";

export interface ItineraryRepository {
  findById(tenantId: TenantId, id: EntityId): Promise<Itinerary | null>;
  save(itinerary: Itinerary, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class SaveItinerary {
  constructor(private readonly itineraries: ItineraryRepository) {}

  async execute(itinerary: Itinerary, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<Itinerary> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const owned: Itinerary = { ...itinerary, tenantId };
    assertValidItinerary(owned);
    await this.itineraries.save(owned, idempotencyKey);
    return owned;
  }
}

export class CloneItinerary {
  constructor(private readonly itineraries: ItineraryRepository, private readonly newId: () => EntityId) {}

  async execute(sourceId: EntityId, context: TenantContext): Promise<Itinerary> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const source = await this.itineraries.findById(tenantId, sourceId);
    if (source === null) {
      throw new Error("Itinerary not found.");
    }
    const clone: Itinerary = {
      ...source,
      id: this.newId(),
      name: `${source.name} (copia)`,
      version: source.version + 1,
      status: "borrador"
    };
    await this.itineraries.save(clone);
    return clone;
  }
}""",
    )


def add_subscriptions() -> None:
    base = ROOT / "services" / "subscriptions" / "src"
    write(
        base / "domain" / "subscription.ts",
        """import type { EntityId, Money, TenantId } from "@totem/shared-kernel";

export type PlanStatus = "activo" | "inactivo";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "suspended";

export type Plan = {
  readonly id: EntityId;
  readonly name: string;
  readonly monthlyPrice: Money;
  readonly annualPrice: Money | null;
  readonly status: PlanStatus;
  readonly limits: Record<string, unknown>;
};

export type Subscription = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly planId: EntityId;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly providerSubscriptionId: string | null;
  readonly lastPaymentAttemptAt: string | null;
};

export function assertSubscriptionCanRenew(subscription: Subscription, now: string): void {
  if (subscription.status === "cancelled" || subscription.status === "suspended") {
    throw new Error("Subscription cannot renew from terminal state.");
  }
  if (subscription.lastPaymentAttemptAt !== null && subscription.lastPaymentAttemptAt.slice(0, 10) === now.slice(0, 10)) {
    throw new Error("Subscription already attempted renewal today.");
  }
}""",
    )
    write(
        base / "application" / "subscription-use-cases.ts",
        """import type { EntityId, IdempotencyKey, Money, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertSubscriptionCanRenew, type Plan, type Subscription } from "../domain/subscription.js";

export interface SubscriptionRepository {
  findPlan(planId: EntityId): Promise<Plan | null>;
  findByTenant(tenantId: TenantId): Promise<Subscription | null>;
  save(subscription: Subscription, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export interface BillingGatewayPort {
  chargeTenant(input: { tenantId: TenantId; amount: Money; idempotencyKey: IdempotencyKey }): Promise<{ providerReference: string }>;
}

export class ChangeTenantPlan {
  constructor(private readonly subscriptions: SubscriptionRepository) {}

  async execute(planId: EntityId, context: TenantContext): Promise<Subscription> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const plan = await this.subscriptions.findPlan(planId);
    if (plan === null || plan.status !== "activo") {
      throw new Error("Plan is not available.");
    }
    const current = await this.subscriptions.findByTenant(tenantId);
    if (current === null) {
      throw new Error("Subscription not found.");
    }
    const updated: Subscription = { ...current, planId, status: "active" };
    await this.subscriptions.save(updated);
    return updated;
  }
}

export class RenewSubscription {
  constructor(private readonly subscriptions: SubscriptionRepository, private readonly billing: BillingGatewayPort, private readonly now: () => string) {}

  async execute(idempotencyKey: IdempotencyKey, context: TenantContext): Promise<Subscription> {
    const tenantId = requireTenant(context);
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (subscription === null) {
      throw new Error("Subscription not found.");
    }
    assertSubscriptionCanRenew(subscription, this.now());
    const plan = await this.subscriptions.findPlan(subscription.planId);
    if (plan === null) {
      throw new Error("Plan not found.");
    }
    await this.billing.chargeTenant({ tenantId, amount: plan.monthlyPrice, idempotencyKey });
    const renewed: Subscription = { ...subscription, status: "active", lastPaymentAttemptAt: this.now() };
    await this.subscriptions.save(renewed, idempotencyKey);
    return renewed;
  }
}""",
    )


def add_notifications() -> None:
    base = ROOT / "services" / "notifications" / "src"
    write(
        base / "domain" / "notification.ts",
        """import type { EntityId, TenantId, UserId } from "@totem/shared-kernel";

export type NotificationChannel = "in_app" | "email";
export type NotificationStatus = "pendiente" | "enviada" | "leida" | "fallida";

export type Notification = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly recipientUserId: UserId | null;
  readonly recipientEmail: string | null;
  readonly channel: NotificationChannel;
  readonly subject: string;
  readonly body: string;
  readonly status: NotificationStatus;
  readonly metadata: Record<string, unknown>;
};

export function assertDeliverableNotification(notification: Notification): void {
  if (notification.channel === "email" && notification.recipientEmail === null) {
    throw new Error("Email notification requires recipient email.");
  }
  if (notification.channel === "in_app" && notification.recipientUserId === null) {
    throw new Error("In-app notification requires recipient user.");
  }
}""",
    )
    write(
        base / "application" / "notification-use-cases.ts",
        """import type { IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { requireTenant } from "@totem/shared-kernel";
import { assertDeliverableNotification, type Notification } from "../domain/notification.js";

export interface NotificationRepository {
  save(notification: Notification, idempotencyKey?: IdempotencyKey): Promise<void>;
  listUnread(tenantId: TenantId): Promise<readonly Notification[]>;
}

export interface EmailPort {
  send(input: { to: string; subject: string; body: string }): Promise<void>;
}

export class CreateNotification {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(notification: Notification, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<Notification> {
    const tenantId = requireTenant(context);
    const owned: Notification = { ...notification, tenantId };
    assertDeliverableNotification(owned);
    await this.notifications.save(owned, idempotencyKey);
    return owned;
  }
}

export class DispatchEmailNotification {
  constructor(private readonly notifications: NotificationRepository, private readonly email: EmailPort) {}

  async execute(notification: Notification, context: TenantContext): Promise<Notification> {
    const tenantId = requireTenant(context);
    const owned: Notification = { ...notification, tenantId };
    assertDeliverableNotification(owned);
    if (owned.recipientEmail === null) {
      throw new Error("Recipient email is required.");
    }
    await this.email.send({ to: owned.recipientEmail, subject: owned.subject, body: owned.body });
    const sent: Notification = { ...owned, status: "enviada" };
    await this.notifications.save(sent);
    return sent;
  }
}""",
    )


def add_assistant_support_platform_audit() -> None:
    files = {
        "assistant": (
            "assistant.ts",
            """import type { EntityId, TenantId } from "@totem/shared-kernel";

export type AssistantSession = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly token: string;
  readonly language: "es" | "en";
  readonly status: "active" | "completed" | "expired";
  readonly intentData: Record<string, unknown>;
};

export type AssistantLead = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly travelerName: string;
  readonly travelerEmail: string;
  readonly message: string | null;
  readonly matchedTripId: EntityId | null;
  readonly status: "new" | "contacted" | "converted" | "closed";
};""",
            "assistant-use-cases.ts",
            """import type { IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { requireTenant } from "@totem/shared-kernel";
import type { AssistantLead, AssistantSession } from "../domain/assistant.js";

export interface AssistantRepository {
  saveSession(session: AssistantSession, idempotencyKey?: IdempotencyKey): Promise<void>;
  saveLead(lead: AssistantLead, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export interface AiCompletionPort {
  complete(input: { messages: readonly { role: "user" | "assistant" | "system"; content: string }[] }): Promise<string>;
}

export class CreateAssistantLead {
  constructor(private readonly assistant: AssistantRepository) {}

  async execute(lead: AssistantLead, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<AssistantLead> {
    const tenantId: TenantId = requireTenant(context);
    const owned: AssistantLead = { ...lead, tenantId, status: "new" };
    await this.assistant.saveLead(owned, idempotencyKey);
    return owned;
  }
}""",
        ),
        "support": (
            "support-ticket.ts",
            """import type { EntityId, TenantId } from "@totem/shared-kernel";

export type SupportTicket = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly adminEmail: string;
  readonly subject: string;
  readonly description: string;
  readonly priority: "normal" | "alta" | "urgente";
  readonly status: "abierto" | "respondido" | "cerrado";
  readonly answer: string | null;
};

export function assertTicketCanBeClosed(ticket: SupportTicket): void {
  if (ticket.answer === null || ticket.answer.trim().length === 0) {
    throw new Error("Support ticket requires an answer before closing.");
  }
}""",
            "support-use-cases.ts",
            """import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertTicketCanBeClosed, type SupportTicket } from "../domain/support-ticket.js";

export interface SupportTicketRepository {
  findById(tenantId: TenantId, id: EntityId): Promise<SupportTicket | null>;
  save(ticket: SupportTicket, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class CreateSupportTicket {
  constructor(private readonly tickets: SupportTicketRepository) {}

  async execute(ticket: SupportTicket, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<SupportTicket> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const owned = { ...ticket, tenantId, status: "abierto" as const };
    await this.tickets.save(owned, idempotencyKey);
    return owned;
  }
}

export class CloseSupportTicket {
  constructor(private readonly tickets: SupportTicketRepository) {}

  async execute(ticketId: EntityId, context: TenantContext): Promise<SupportTicket> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const ticket = await this.tickets.findById(tenantId, ticketId);
    if (ticket === null) {
      throw new Error("Support ticket not found.");
    }
    assertTicketCanBeClosed(ticket);
    const closed = { ...ticket, status: "cerrado" as const };
    await this.tickets.save(closed);
    return closed;
  }
}""",
        ),
        "platform": (
            "platform.ts",
            """import type { EntityId } from "@totem/shared-kernel";

export type PlatformTenantSummary = {
  readonly tenantId: EntityId;
  readonly name: string;
  readonly domain: string;
  readonly status: "activo" | "cancelado" | "suspendido";
  readonly totalTrips: number;
  readonly totalUsers: number;
  readonly totalEnrollments: number;
};

export type PlatformMetrics = {
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly suspendedTenants: number;
  readonly openTickets: number;
};""",
            "platform-use-cases.ts",
            """import type { EntityId, TenantContext } from "@totem/shared-kernel";

export interface PlatformRepository {
  getMetrics(): Promise<import("../domain/platform.js").PlatformMetrics>;
  listTenants(): Promise<readonly import("../domain/platform.js").PlatformTenantSummary[]>;
  changeTenantStatus(tenantId: EntityId, status: "activo" | "cancelado" | "suspendido"): Promise<void>;
}

function assertSuperadmin(context: TenantContext): void {
  if (context.role !== "superadmin") {
    throw new Error("Superadmin role is required.");
  }
}

export class GetPlatformMetrics {
  constructor(private readonly platform: PlatformRepository) {}

  async execute(context: TenantContext) {
    assertSuperadmin(context);
    return this.platform.getMetrics();
  }
}

export class SuspendTenant {
  constructor(private readonly platform: PlatformRepository) {}

  async execute(tenantId: EntityId, context: TenantContext): Promise<void> {
    assertSuperadmin(context);
    await this.platform.changeTenantStatus(tenantId, "suspendido");
  }
}""",
        ),
        "audit": (
            "audit-event.ts",
            """import type { EntityId, TenantId, UserId } from "@totem/shared-kernel";

export type AuditEvent = {
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly actorUserId: UserId | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: EntityId | null;
  readonly payload: Record<string, unknown>;
  readonly occurredAt: string;
  readonly sealedAt: string | null;
};

export function assertAppendOnly(event: AuditEvent): void {
  if (event.sealedAt !== null) {
    throw new Error("Sealed audit event cannot be modified.");
  }
}""",
            "audit-use-cases.ts",
            """import type { IdempotencyKey, TenantContext } from "@totem/shared-kernel";
import type { AuditEvent } from "../domain/audit-event.js";

export interface AuditRepository {
  append(event: AuditEvent, idempotencyKey?: IdempotencyKey): Promise<void>;
  listByTenant(tenantId: AuditEvent["tenantId"]): Promise<readonly AuditEvent[]>;
}

export class RecordAuditEvent {
  constructor(private readonly audit: AuditRepository) {}

  async execute(event: AuditEvent, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<AuditEvent> {
    const recorded: AuditEvent = {
      ...event,
      tenantId: event.tenantId ?? context.tenantId,
      actorUserId: event.actorUserId ?? context.userId
    };
    await this.audit.append(recorded, idempotencyKey);
    return recorded;
  }
}""",
        ),
    }
    for service, (domain_file, domain_content, app_file, app_content) in files.items():
        base = ROOT / "services" / service / "src"
        write(base / "domain" / domain_file, domain_content)
        write(base / "application" / app_file, app_content)


def add_frontend_contexts() -> None:
    contexts = [
        "identity",
        "tenancy",
        "catalog",
        "itineraries",
        "trips",
        "enrollments",
        "payments",
        "subscriptions",
        "documents",
        "notifications",
        "assistant",
        "support",
        "platform",
        "audit",
    ]
    for context in contexts:
        base = ROOT / "apps" / "web" / "src" / "contexts" / context
        write(
            base / "domain" / "capability.ts",
            f"""export type {context.title().replace("-", "")}Capability = {{
  readonly service: "{context}";
  readonly aggregate: string;
  readonly capability: string;
}};""",
        )
        write(
            base / "ports" / "api.ts",
            f"""import type {{ {context.title().replace("-", "")}Capability }} from "../domain/capability";

export interface {context.title().replace("-", "")}ApiPort {{
  getCapability(): Promise<{context.title().replace("-", "")}Capability>;
}}""",
        )
        write(
            base / "adapters" / "service-api.ts",
            f"""import type {{ {context.title().replace("-", "")}ApiPort }} from "../ports/api";
import type {{ {context.title().replace("-", "")}Capability }} from "../domain/capability";

export class {context.title().replace("-", "")}ServiceApi implements {context.title().replace("-", "")}ApiPort {{
  constructor(private readonly baseUrl: string) {{}}

  async getCapability(): Promise<{context.title().replace("-", "")}Capability> {{
    const response = await fetch(`${{this.baseUrl}}/{context}/capability`, {{ cache: "no-store" }});
    if (!response.ok) {{
      throw new Error("{context} capability request failed.");
    }}
    return response.json() as Promise<{context.title().replace("-", "")}Capability>;
  }}
}}""",
        )
        write(
            base / "application" / "load-capability.ts",
            f"""import type {{ {context.title().replace("-", "")}ApiPort }} from "../ports/api";

export class Load{context.title().replace("-", "")}Capability {{
  constructor(private readonly api: {context.title().replace("-", "")}ApiPort) {{}}

  execute() {{
    return this.api.getCapability();
  }}
}}""",
        )


def main() -> None:
    add_catalog()
    add_itineraries()
    add_subscriptions()
    add_notifications()
    add_assistant_support_platform_audit()
    add_frontend_contexts()


if __name__ == "__main__":
    main()
