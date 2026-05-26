from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


SERVICES = {
    "identity": {
        "aggregate": "Profile",
        "table": "profiles",
        "capability": "profiles roles invitations authentication",
        "commands": ["CreateProfile", "UpdateProfileRole", "CreateInvitation", "AcceptInvitation"],
    },
    "tenancy": {
        "aggregate": "Tenant",
        "table": "tenants",
        "capability": "tenant lifecycle preferences onboarding",
        "commands": ["CreateTenant", "ResolveTenant", "UpdateTenantPreferences", "CompleteTenantOnboarding"],
    },
    "catalog": {
        "aggregate": "CatalogItem",
        "table": "catalog_items",
        "capability": "destinations activities accommodations addons",
        "commands": ["CreateCatalogItem", "UpdateCatalogItem", "PublishCatalogItem", "ArchiveCatalogItem"],
    },
    "itineraries": {
        "aggregate": "Itinerary",
        "table": "itineraries",
        "capability": "itineraries days events versioning",
        "commands": ["CreateItinerary", "UpdateItinerary", "CloneItinerary", "PublishItinerary"],
    },
    "trips": {
        "aggregate": "Trip",
        "table": "trips",
        "capability": "trips landings operations public catalogue",
        "commands": ["CreateTrip", "UpdateTrip", "PublishTrip", "ArchiveTrip"],
    },
    "enrollments": {
        "aggregate": "Enrollment",
        "table": "enrollments",
        "capability": "public and manual enrollments health data exports",
        "commands": ["CreatePublicEnrollment", "CreateManualEnrollment", "ConfirmEnrollment", "CancelEnrollment"],
    },
    "payments": {
        "aggregate": "Payment",
        "table": "payments",
        "capability": "traveler payments installments reconciliation",
        "commands": ["RegisterManualPayment", "ProcessPaymentWebhook", "ChangePaymentStatus", "ReconcilePayment"],
    },
    "subscriptions": {
        "aggregate": "Subscription",
        "table": "subscriptions",
        "capability": "saas plans tenant subscriptions provider billing",
        "commands": ["CreatePlan", "SubscribeTenant", "ChangePlan", "ProcessSubscriptionWebhook"],
    },
    "documents": {
        "aggregate": "TravelerDocument",
        "table": "traveler_documents",
        "capability": "document upload review approval rejection",
        "commands": ["UploadDocument", "ApproveDocument", "RejectDocument", "DeleteDocument"],
    },
    "rooming": {
        "aggregate": "RoomingPlan",
        "table": "rooming_plans",
        "capability": "rooming plans rooms traveler assignments publish locks",
        "commands": ["CreateRoomingPlan", "AssignTravelerToRoom", "RemoveTravelerFromRoom", "PublishRoomingPlan"],
    },
    "notifications": {
        "aggregate": "Notification",
        "table": "notifications",
        "capability": "tenant notifications email delivery",
        "commands": ["CreateNotification", "MarkNotificationRead", "SendEmailNotification", "DismissNotification"],
    },
    "assistant": {
        "aggregate": "AssistantSession",
        "table": "assistant_sessions",
        "capability": "ai sessions messages leads trip plans",
        "commands": ["CreateAssistantSession", "SendAssistantMessage", "CreateAssistantLead", "SaveTripPlan"],
    },
    "support": {
        "aggregate": "SupportTicket",
        "table": "support_tickets",
        "capability": "support tickets responses platform escalation",
        "commands": ["CreateSupportTicket", "RespondSupportTicket", "ChangeTicketStatus", "EscalateTicket"],
    },
    "platform": {
        "aggregate": "PlatformTenantView",
        "table": "platform_tenant_views",
        "capability": "superadmin platform metrics tenant governance",
        "commands": ["ListPlatformTenants", "SuspendTenant", "ReactivateTenant", "GetPlatformMetrics"],
    },
    "audit": {
        "aggregate": "AuditEvent",
        "table": "audit_events",
        "capability": "durable audit trail outbox compliance",
        "commands": ["RecordAuditEvent", "ListAuditEvents", "SealAuditEvent", "ExportAuditEvents"],
    },
}


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def pascal_to_words(value: str) -> str:
    words = []
    current = ""
    for char in value:
        if char.isupper() and current:
            words.append(current)
            current = char
        else:
            current += char
    if current:
        words.append(current)
    return " ".join(words).lower()


def package_json() -> str:
    return """{
  "name": "totem-hub",
  "version": "2.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "services/*",
    "packages/*"
  ],
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "dev:web": "pnpm --filter @totem/web dev",
    "dev:gateway": "pnpm --filter @totem/api-gateway dev",
    "verify:architecture": "node tools/verify-architecture.mjs"
  },
  "devDependencies": {
    "@types/node": "^24.12.4",
    "typescript": "^6.0.3"
  }
}"""


def tsconfig_base() -> str:
    return """{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  }
}"""


def shared_kernel() -> None:
    base = ROOT / "packages" / "shared-kernel"
    write(
        base / "package.json",
        """{
  "name": "@totem/shared-kernel",
  "version": "2.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "typescript": "^6.0.3"
  }
}""",
    )
    write(
        base / "tsconfig.json",
        """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}""",
    )
    write(
        base / "src" / "ids.ts",
        """export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type TenantId = Brand<string, "TenantId">;
export type UserId = Brand<string, "UserId">;
export type EntityId = Brand<string, "EntityId">;
export type IdempotencyKey = Brand<string, "IdempotencyKey">;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseEntityId(value: string): EntityId {
  if (!uuidPattern.test(value)) {
    throw new Error("Invalid UUID.");
  }
  return value as EntityId;
}

export function parseTenantId(value: string): TenantId {
  return parseEntityId(value) as unknown as TenantId;
}

export function parseUserId(value: string): UserId {
  return parseEntityId(value) as unknown as UserId;
}

export function parseIdempotencyKey(value: string): IdempotencyKey {
  const normalized = value.trim();
  if (normalized.length < 16) {
    throw new Error("Idempotency key must have at least 16 characters.");
  }
  return normalized as IdempotencyKey;
}""",
    )
    write(
        base / "src" / "money.ts",
        """export type CurrencyCode = "PEN" | "USD";

export type Money = {
  readonly decimal: string;
  readonly currency: CurrencyCode;
};

const decimalPattern = /^-?\\d+(\\.\\d{1,2})?$/;

export function createMoney(decimal: string, currency: CurrencyCode = "PEN"): Money {
  if (!decimalPattern.test(decimal)) {
    throw new Error("Invalid money decimal representation.");
  }
  return Object.freeze({ decimal, currency });
}

export function moneyToMinorUnits(money: Money): bigint {
  const [wholePart, fractionPart = ""] = money.decimal.split(".");
  const fraction = fractionPart.padEnd(2, "0").slice(0, 2);
  return BigInt(wholePart) * 100n + BigInt(fraction);
}""",
    )
    write(
        base / "src" / "tenant-context.ts",
        """import type { TenantId, UserId } from "./ids.js";

export type Role = "superadmin" | "admin" | "viajero" | "system" | "anonymous";

export type TenantContext = {
  readonly tenantId: TenantId | null;
  readonly userId: UserId | null;
  readonly role: Role;
  readonly requestId: string;
  readonly isPublic: boolean;
};

export function requireTenant(context: TenantContext): TenantId {
  if (context.tenantId === null) {
    throw new Error("Tenant context is required.");
  }
  return context.tenantId;
}

export function assertAdmin(context: TenantContext): void {
  if (context.role !== "admin" && context.role !== "superadmin") {
    throw new Error("Admin role is required.");
  }
}""",
    )
    write(
        base / "src" / "domain-event.ts",
        """import type { EntityId, TenantId } from "./ids.js";

export type DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  readonly eventId: EntityId;
  readonly aggregateId: EntityId;
  readonly tenantId: TenantId | null;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly payload: TPayload;
};""",
    )
    write(
        base / "src" / "result.ts",
        """export type AppError = {
  readonly code: string;
  readonly message: string;
};

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T>(code: string, message: string): Result<T> {
  return { ok: false, error: { code, message } };
}""",
    )
    write(
        base / "src" / "index.ts",
        """export * from "./ids.js";
export * from "./money.js";
export * from "./tenant-context.js";
export * from "./domain-event.js";
export * from "./result.js";""",
    )


def service_runtime() -> None:
    base = ROOT / "packages" / "service-runtime"
    write(
        base / "package.json",
        """{
  "name": "@totem/service-runtime",
  "version": "2.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@totem/shared-kernel": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^24.12.4",
    "typescript": "^6.0.3"
  }
}""",
    )
    write(
        base / "tsconfig.json",
        """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}""",
    )
    write(
        base / "src" / "http.ts",
        """import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { parseTenantId, parseUserId, type TenantContext } from "@totem/shared-kernel";

export type JsonHandler = (request: JsonRequest) => Promise<unknown>;

export type JsonRequest = {
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
  readonly context: TenantContext;
  readonly headers: IncomingMessage["headers"];
};

export type Route = {
  readonly method: string;
  readonly path: string;
  readonly handler: JsonHandler;
};

export function createTenantContext(request: IncomingMessage): TenantContext {
  const tenantHeader = request.headers["x-tenant-id"];
  const userHeader = request.headers["x-user-id"];
  const roleHeader = request.headers["x-user-role"];
  const requestHeader = request.headers["x-request-id"];

  return {
    tenantId: typeof tenantHeader === "string" && tenantHeader.length > 0 ? parseTenantId(tenantHeader) : null,
    userId: typeof userHeader === "string" && userHeader.length > 0 ? parseUserId(userHeader) : null,
    role: roleHeader === "superadmin" || roleHeader === "admin" || roleHeader === "viajero" || roleHeader === "system" ? roleHeader : "anonymous",
    requestId: typeof requestHeader === "string" && requestHeader.length > 0 ? requestHeader : randomUUID(),
    isPublic: false
  };
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (raw.length === 0) {
    return null;
  }
  return JSON.parse(raw);
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

export function startHttpService(serviceName: string, routes: readonly Route[]): void {
  const port = Number(process.env.PORT ?? "3000");
  const server = createServer(async (request, response) => {
    try {
      const method = request.method ?? "GET";
      const path = new URL(request.url ?? "/", "http://localhost").pathname;

      if (method === "GET" && path === "/health") {
        send(response, 200, { status: "ok", service: serviceName, architecture: "ddd-hexagonal-microservice" });
        return;
      }

      const route = routes.find((candidate) => candidate.method === method && candidate.path === path);
      if (route === undefined) {
        send(response, 404, { error: { code: "not_found", message: "Route not found." } });
        return;
      }

      const body = await readBody(request);
      const payload = await route.handler({
        method,
        path,
        body,
        context: createTenantContext(request),
        headers: request.headers
      });
      send(response, 200, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error.";
      send(response, 400, { error: { code: "request_failed", message } });
    }
  });

  server.listen(port, () => {
    console.log(`${serviceName} listening on ${port}`);
  });

  const shutdown = (signal: NodeJS.Signals) => {
    console.log(`${serviceName} received ${signal}; draining HTTP server`);
    server.close((error) => {
      if (error) {
        console.error(`${serviceName} shutdown failed`, error);
        process.exit(1);
      }
      process.exit(0);
    });
    setTimeout(() => {
      console.error(`${serviceName} shutdown timed out`);
      process.exit(1);
    }, 10_000).unref();
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}""",
    )
    write(base / "src" / "index.ts", 'export * from "./http.js";')


def service_files(name: str, cfg: dict[str, object]) -> None:
    service = ROOT / "services" / name
    aggregate = str(cfg["aggregate"])
    table = str(cfg["table"])
    capability = str(cfg["capability"])
    commands = list(cfg["commands"])
    first_command = str(commands[0])
    entity_type = pascal_to_words(aggregate)

    write(
        service / "package.json",
        f"""{{
  "name": "@totem/{name}-service",
  "version": "2.0.0",
  "type": "module",
  "main": "dist/main.js",
  "types": "dist/main.d.ts",
  "scripts": {{
    "build": "prisma generate && tsc -p tsconfig.json",
    "dev": "tsx src/main.ts",
    "start": "node dist/main.js",
    "test": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  }},
  "dependencies": {{
    "@prisma/client": "^7.8.0",
    "@totem/shared-kernel": "workspace:*",
    "@totem/service-runtime": "workspace:*"
  }},
  "devDependencies": {{
    "@types/node": "^24.12.4",
    "prisma": "^7.8.0",
    "tsx": "^4.22.3",
    "typescript": "^6.0.3"
  }}
}}""",
    )
    write(
        service / "tsconfig.json",
        """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}""",
    )
    write(
        service / "prisma" / "schema.prisma",
        f"""generator client {{
  provider            = "prisma-client"
  output              = "../src/generated/prisma"
  runtime             = "nodejs"
  moduleFormat       = "esm"
  importFileExtension = "ts"
}}

datasource db {{
  provider = "postgresql"
}}

model {aggregate}Record {{
  id             String   @id @db.Uuid
  tenantId       String?  @map("tenant_id") @db.Uuid
  status         String
  version        Int      @default(1)
  idempotencyKey String?  @unique @map("idempotency_key")
  payload        Json
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@index([tenantId])
  @@map("{table}")
}}

model OutboxEvent {{
  id            String   @id @db.Uuid
  aggregateId   String   @map("aggregate_id") @db.Uuid
  tenantId      String?  @map("tenant_id") @db.Uuid
  eventType     String   @map("event_type")
  payload       Json
  occurredAt    DateTime @default(now()) @map("occurred_at")
  processedAt   DateTime? @map("processed_at")

  @@index([tenantId])
  @@index([processedAt])
  @@map("{table}_outbox")
}}
""",
    )
    write(
        service / "prisma.config.ts",
        """import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? ""
  }
});""",
    )
    write(
        service / "src" / "domain" / "errors.ts",
        f"""export class {aggregate}DomainError extends Error {{
  constructor(message: string) {{
    super(message);
    this.name = "{aggregate}DomainError";
  }}
}}

export class {aggregate}InvariantViolation extends {aggregate}DomainError {{
  constructor(message: string) {{
    super(message);
    this.name = "{aggregate}InvariantViolation";
  }}
}}""",
    )
    write(
        service / "src" / "domain" / "events.ts",
        f"""import type {{ DomainEvent }} from "@totem/shared-kernel";

export type {aggregate}Event = DomainEvent<{{
  readonly status: string;
  readonly version: number;
}}> & {{
  readonly eventType: "{aggregate}Created" | "{aggregate}Updated" | "{aggregate}StatusChanged";
}};""",
    )
    write(
        service / "src" / "domain" / "entities.ts",
        f"""import type {{ EntityId, TenantId }} from "@totem/shared-kernel";
import {{ {aggregate}InvariantViolation }} from "./errors.js";

export type {aggregate}Status = "draft" | "active" | "published" | "archived" | "cancelled" | "completed";

export type {aggregate}Snapshot = {{
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: {aggregate}Status;
  readonly version: number;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}};

export class {aggregate} {{
  private constructor(private readonly state: {aggregate}Snapshot) {{}}

  static create(input: Omit<{aggregate}Snapshot, "version" | "createdAt" | "updatedAt"> & {{ readonly now: string }}): {aggregate} {{
    if (input.status === "cancelled" || input.status === "completed") {{
      throw new {aggregate}InvariantViolation("A new {entity_type} cannot start in a terminal state.");
    }}
    return new {aggregate}({{
      id: input.id,
      tenantId: input.tenantId,
      status: input.status,
      version: 1,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now
    }});
  }}

  static rehydrate(snapshot: {aggregate}Snapshot): {aggregate} {{
    return new {aggregate}(snapshot);
  }}

  changeStatus(status: {aggregate}Status, now: string): {aggregate} {{
    if (this.state.status === "archived" && status !== "archived") {{
      throw new {aggregate}InvariantViolation("Archived {entity_type} cannot be reactivated without a dedicated restoration use case.");
    }}
    return new {aggregate}({{
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: now
    }});
  }}

  updatePayload(payload: Record<string, unknown>, now: string): {aggregate} {{
    return new {aggregate}({{
      ...this.state,
      payload,
      version: this.state.version + 1,
      updatedAt: now
    }});
  }}

  toSnapshot(): {aggregate}Snapshot {{
    return this.state;
  }}
}}""",
    )
    write(
        service / "src" / "application" / "commands.ts",
        f"""import type {{ EntityId, IdempotencyKey, TenantId }} from "@totem/shared-kernel";
import type {{ {aggregate}Status }} from "../domain/entities.js";

export type Create{aggregate}Command = {{
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: {aggregate}Status;
  readonly payload: Record<string, unknown>;
}};

export type Update{aggregate}Command = {{
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly payload: Record<string, unknown>;
}};

export type Change{aggregate}StatusCommand = {{
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
  readonly status: {aggregate}Status;
}};

export type {name.title().replace("-", "")}CommandName =
{chr(10).join(f'  | "{command}"' for command in commands)};""",
    )
    write(
        service / "src" / "application" / "queries.ts",
        f"""import type {{ EntityId, TenantId }} from "@totem/shared-kernel";

export type Get{aggregate}Query = {{
  readonly id: EntityId;
  readonly tenantId: TenantId | null;
}};

export type List{aggregate}sQuery = {{
  readonly tenantId: TenantId | null;
  readonly page: number;
  readonly pageSize: number;
}};""",
    )
    write(
        service / "src" / "ports" / "repositories.ts",
        f"""import type {{ EntityId, IdempotencyKey, TenantId }} from "@totem/shared-kernel";
import type {{ {aggregate}, {aggregate}Snapshot }} from "../domain/entities.js";

export interface {aggregate}Repository {{
  findById(id: EntityId, tenantId: TenantId | null): Promise<{aggregate} | null>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<{aggregate} | null>;
  listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly {aggregate}Snapshot[]>;
  save(entity: {aggregate}, idempotencyKey?: IdempotencyKey): Promise<void>;
}}""",
    )
    write(
        service / "src" / "application" / "use-cases.ts",
        f"""import type {{ TenantContext }} from "@totem/shared-kernel";
import {{ requireTenant }} from "@totem/shared-kernel";
import {{ {aggregate} }} from "../domain/entities.js";
import type {{ {aggregate}Repository }} from "../ports/repositories.js";
import type {{ Change{aggregate}StatusCommand, Create{aggregate}Command, Update{aggregate}Command }} from "./commands.js";
import type {{ Get{aggregate}Query, List{aggregate}sQuery }} from "./queries.js";

export class Create{aggregate}UseCase {{
  constructor(private readonly repository: {aggregate}Repository, private readonly clock: () => string) {{}}

  async execute(command: Create{aggregate}Command, context: TenantContext) {{
    if (!context.isPublic && context.role !== "superadmin") {{
      requireTenant(context);
    }}
    const existing = await this.repository.findByIdempotencyKey(command.idempotencyKey);
    if (existing !== null) {{
      return existing.toSnapshot();
    }}
    const entity = {aggregate}.create({{
      id: command.id,
      tenantId: command.tenantId,
      status: command.status,
      payload: command.payload,
      now: this.clock()
    }});
    await this.repository.save(entity, command.idempotencyKey);
    return entity.toSnapshot();
  }}
}}

export class Update{aggregate}UseCase {{
  constructor(private readonly repository: {aggregate}Repository, private readonly clock: () => string) {{}}

  async execute(command: Update{aggregate}Command, context: TenantContext) {{
    if (!context.isPublic && context.role !== "superadmin") {{
      requireTenant(context);
    }}
    const entity = await this.repository.findById(command.id, command.tenantId);
    if (entity === null) {{
      throw new Error("{aggregate} not found.");
    }}
    const updated = entity.updatePayload(command.payload, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }}
}}

export class Change{aggregate}StatusUseCase {{
  constructor(private readonly repository: {aggregate}Repository, private readonly clock: () => string) {{}}

  async execute(command: Change{aggregate}StatusCommand, context: TenantContext) {{
    if (!context.isPublic && context.role !== "superadmin") {{
      requireTenant(context);
    }}
    const entity = await this.repository.findById(command.id, command.tenantId);
    if (entity === null) {{
      throw new Error("{aggregate} not found.");
    }}
    const updated = entity.changeStatus(command.status, this.clock());
    await this.repository.save(updated);
    return updated.toSnapshot();
  }}
}}

export class Get{aggregate}UseCase {{
  constructor(private readonly repository: {aggregate}Repository) {{}}

  async execute(query: Get{aggregate}Query, context: TenantContext) {{
    if (!context.isPublic && context.role !== "superadmin") {{
      requireTenant(context);
    }}
    const entity = await this.repository.findById(query.id, query.tenantId);
    if (entity === null) {{
      throw new Error("{aggregate} not found.");
    }}
    return entity.toSnapshot();
  }}
}}

export class List{aggregate}sUseCase {{
  constructor(private readonly repository: {aggregate}Repository) {{}}

  async execute(query: List{aggregate}sQuery, context: TenantContext) {{
    if (!context.isPublic && context.role !== "superadmin") {{
      requireTenant(context);
    }}
    return this.repository.listByTenant(query.tenantId, query.page, query.pageSize);
  }}
}}""",
    )
    write(
        service / "src" / "adapters" / "prisma" / "repository.ts",
        f"""import type {{ PrismaClient }} from "../../generated/prisma/client.js";
import type {{ EntityId, IdempotencyKey, TenantId }} from "@totem/shared-kernel";
import {{ {aggregate}, type {aggregate}Snapshot }} from "../../domain/entities.js";
import type {{ {aggregate}Repository }} from "../../ports/repositories.js";

type {aggregate}Record = {{
  id: string;
  tenantId: string | null;
  status: string;
  version: number;
  payload: unknown;
  createdAt: Date;
  updatedAt: Date;
}};

function toSnapshot(record: {aggregate}Record): {aggregate}Snapshot {{
  return {{
    id: record.id as EntityId,
    tenantId: record.tenantId as TenantId | null,
    status: record.status as {aggregate}Snapshot["status"],
    version: record.version,
    payload: record.payload as Record<string, unknown>,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  }};
}}

export class Prisma{aggregate}Repository implements {aggregate}Repository {{
  constructor(private readonly prisma: PrismaClient) {{}}

  async findById(id: EntityId, tenantId: TenantId | null): Promise<{aggregate} | null> {{
    const record = await this.prisma.{aggregate[0].lower() + aggregate[1:]}Record.findFirst({{
      where: {{ id: String(id), tenantId: tenantId === null ? null : String(tenantId) }}
    }});
    return record === null ? null : {aggregate}.rehydrate(toSnapshot(record));
  }}

  async findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<{aggregate} | null> {{
    const record = await this.prisma.{aggregate[0].lower() + aggregate[1:]}Record.findUnique({{
      where: {{ idempotencyKey: String(idempotencyKey) }}
    }});
    return record === null ? null : {aggregate}.rehydrate(toSnapshot(record));
  }}

  async listByTenant(tenantId: TenantId | null, page: number, pageSize: number): Promise<readonly {aggregate}Snapshot[]> {{
    const records = await this.prisma.{aggregate[0].lower() + aggregate[1:]}Record.findMany({{
      where: {{ tenantId: tenantId === null ? null : String(tenantId) }},
      orderBy: {{ createdAt: "desc" }},
      skip: (page - 1) * pageSize,
      take: pageSize
    }});
    return records.map(toSnapshot);
  }}

  async save(entity: {aggregate}, idempotencyKey?: IdempotencyKey): Promise<void> {{
    const snapshot = entity.toSnapshot();
    const where = idempotencyKey === undefined ? {{ id: String(snapshot.id) }} : {{ idempotencyKey: String(idempotencyKey) }};
    await this.prisma.{aggregate[0].lower() + aggregate[1:]}Record.upsert({{
      where,
      create: {{
        id: String(snapshot.id),
        tenantId: snapshot.tenantId === null ? null : String(snapshot.tenantId),
        status: snapshot.status,
        version: snapshot.version,
        idempotencyKey: idempotencyKey === undefined ? null : String(idempotencyKey),
        payload: snapshot.payload
      }},
      update: {{
        tenantId: snapshot.tenantId === null ? null : String(snapshot.tenantId),
        status: snapshot.status,
        version: snapshot.version,
        idempotencyKey: idempotencyKey === undefined ? undefined : String(idempotencyKey),
        payload: snapshot.payload
      }}
    }});
  }}
}}""",
    )
    write(
        service / "src" / "adapters" / "http" / "routes.ts",
        f"""import {{ randomUUID }} from "node:crypto";
import {{ parseEntityId, parseIdempotencyKey, parseTenantId }} from "@totem/shared-kernel";
import type {{ Route }} from "@totem/service-runtime";
import type {{ {aggregate}Repository }} from "../../ports/repositories.js";
import {{ Change{aggregate}StatusUseCase, Create{aggregate}UseCase, Get{aggregate}UseCase, List{aggregate}sUseCase, Update{aggregate}UseCase }} from "../../application/use-cases.js";

function asRecord(value: unknown): Record<string, unknown> {{
  if (typeof value !== "object" || value === null || Array.isArray(value)) {{
    throw new Error("Request body must be an object.");
  }}
  return value as Record<string, unknown>;
}}

function aggregateStatus(value: string) {{
  if (value === "draft" || value === "active" || value === "published" || value === "archived" || value === "cancelled" || value === "completed") {{
    return value;
  }}
  throw new Error("Invalid aggregate status.");
}}

export function createRoutes(repository: {aggregate}Repository): readonly Route[] {{
  const clock = () => new Date().toISOString();
  const createUseCase = new Create{aggregate}UseCase(repository, clock);
  const updateUseCase = new Update{aggregate}UseCase(repository, clock);
  const changeStatusUseCase = new Change{aggregate}StatusUseCase(repository, clock);
  const getUseCase = new Get{aggregate}UseCase(repository);
  const listUseCase = new List{aggregate}sUseCase(repository);

  return [
    {{
      method: "GET",
      path: "/{name}/capability",
      handler: async () => ({{ service: "{name}", aggregate: "{aggregate}", capability: "{capability}" }})
    }},
    {{
      method: "POST",
      path: "/{name}",
      handler: async (request) => {{
        const body = asRecord(request.body);
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        const idempotencyKey = typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(randomUUID() + randomUUID());
        return createUseCase.execute({{
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId,
          idempotencyKey,
          status: body.status === "published" ? "published" : "draft",
          payload: asRecord(body.payload ?? {{}})
        }}, request.context);
      }}
    }},
    {{
      method: "PATCH",
      path: "/{name}",
      handler: async (request) => {{
        const body = asRecord(request.body);
        if (typeof body.id !== "string") {{
          throw new Error("id is required.");
        }}
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return updateUseCase.execute({{
          id: parseEntityId(body.id),
          tenantId,
          payload: asRecord(body.payload ?? {{}})
        }}, request.context);
      }}
    }},
    {{
      method: "POST",
      path: "/{name}/status",
      handler: async (request) => {{
        const body = asRecord(request.body);
        if (typeof body.id !== "string" || typeof body.status !== "string") {{
          throw new Error("id and status are required.");
        }}
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return changeStatusUseCase.execute({{
          id: parseEntityId(body.id),
          tenantId,
          status: aggregateStatus(body.status)
        }}, request.context);
      }}
    }},
    {{
      method: "POST",
      path: "/{name}/get",
      handler: async (request) => {{
        const body = asRecord(request.body);
        if (typeof body.id !== "string") {{
          throw new Error("id is required.");
        }}
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return getUseCase.execute({{ id: parseEntityId(body.id), tenantId }}, request.context);
      }}
    }},
    {{
      method: "POST",
      path: "/{name}/list",
      handler: async (request) => {{
        const body = asRecord(request.body ?? {{}});
        const tenantId = typeof body.tenantId === "string" ? parseTenantId(body.tenantId) : request.context.tenantId;
        return listUseCase.execute({{
          tenantId,
          page: typeof body.page === "number" ? body.page : 1,
          pageSize: typeof body.pageSize === "number" ? body.pageSize : 20
        }}, request.context);
      }}
    }}
  ];
}}""",
    )
    write(
        service / "src" / "main.ts",
        f"""import {{ createPostgresPrismaAdapter, startHttpService }} from "@totem/service-runtime";
import {{ PrismaClient }} from "./generated/prisma/client.js";
import {{ Prisma{aggregate}Repository }} from "./adapters/prisma/repository.js";
import {{ createRoutes }} from "./adapters/http/routes.js";

const prisma = new PrismaClient({{ adapter: createPostgresPrismaAdapter() }});
const repository = new Prisma{aggregate}Repository(prisma);

startHttpService("{name}", createRoutes(repository));""",
    )
    write(
        service / "src" / "index.ts",
        f"""export * from "./domain/entities.js";
export * from "./application/use-cases.js";
export * from "./ports/repositories.js";""",
    )


def web_app() -> None:
    base = ROOT / "apps" / "web"
    write(
        base / "package.json",
        """{
  "name": "@totem/web",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --hostname 0.0.0.0 --port 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "test": "tsc --noEmit",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@totem/shared-kernel": "workspace:*",
    "next": "^16.2.6",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "lucide-react": "^1.16.0",
    "recharts": "^3.8.1"
  },
  "devDependencies": {
    "@types/node": "^24.12.4",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^6.0.3"
  }
}""",
    )
    write(
        base / "tsconfig.json",
        """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@contexts/*": ["./src/contexts/*"]
    }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx"]
}""",
    )
    write(
        base / "next.config.ts",
        """import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false
};

export default nextConfig;""",
    )
    write(
        base / "src" / "app" / "layout.tsx",
        """import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Totem HUB",
  description: "Totem HUB microservices DDD modernization"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}""",
    )
    write(
        base / "src" / "app" / "globals.css",
        """:root {
  --bg: #f7f8fb;
  --surface: #ffffff;
  --text: #172033;
  --muted: #667085;
  --border: #d9e0ec;
  --primary: #075e8f;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}""",
    )
    write(
        base / "src" / "app" / "page.tsx",
        """import { ArchitectureDashboard } from "@/contexts/platform/ui/ArchitectureDashboard";

export default function Page() {
  return <ArchitectureDashboard />;
}""",
    )
    write(
        base / "src" / "contexts" / "platform" / "ui" / "ArchitectureDashboard.tsx",
        """const contexts = [
  "identity",
  "tenancy",
  "catalog",
  "itineraries",
  "trips",
  "enrollments",
  "payments",
  "subscriptions",
  "documents",
  "rooming",
  "notifications",
  "assistant",
  "support",
  "platform",
  "audit"
];

export function ArchitectureDashboard() {
  return (
    <main style={{ minHeight: "100vh", padding: 32 }}>
      <section style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 24 }}>
        <header>
          <h1 style={{ margin: 0, fontSize: 36 }}>Totem HUB</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            Modernizacion activa: DDD, arquitectura hexagonal y microservicios por bounded context.
          </p>
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {contexts.map((context) => (
            <article key={context} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
              <strong>{context}</strong>
              <p style={{ color: "var(--muted)", marginBottom: 0 }}>domain, application, ports, adapters, interface</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}""",
    )


def docs_and_infra() -> None:
    write(ROOT / "package.json", package_json())
    write(ROOT / "tsconfig.base.json", tsconfig_base())
    write(
        ROOT / "README.md",
        """# Totem HUB

Modernizacion activa hacia DDD, arquitectura hexagonal y microservicios.

## Codigo activo

```text
apps/web
services/*
packages/*
infra/*
```

## Fuente legacy

```text
ANtigua estructura completa/
```

La carpeta legacy no es estructura activa. Solo se usa como fuente de comportamiento para reimplementar capacidades.
""",
    )
    write(
        ROOT / "AGENTS.md",
        """# AGENTS.md

## Arquitectura activa

Totem HUB se organiza como microservicios DDD hexagonales.

Codigo activo:

- `apps/web`
- `services/*`
- `packages/*`
- `infra/*`

Fuente legacy:

- `ANtigua estructura completa/`

## Prohibiciones

- No crear `backend/apps`.
- No crear `backend/src/totem_hub` como monolito activo.
- No crear `frontend/components`, `frontend/lib` o `frontend/types` como capas globales activas.
- No copiar carpetas legacy completas como estructura activa.
- No usar git en esta migracion.
""",
    )
    write(
        ROOT / "docs" / "REMODERNIZACION.MD",
        """# Remodernizacion Totem HUB

## Mandato

La arquitectura activa es DDD, hexagonal y de microservicios.

## Codigo activo

- `apps/web`: Next.js como frontend y BFF delgado.
- `services/*`: microservicios por bounded context.
- `packages/shared-kernel`: value objects y contratos compartidos.
- `packages/service-runtime`: runtime HTTP comun.
- `infra`: despliegue, PostgreSQL y configuracion.

## Bounded Contexts

- identity
- tenancy
- catalog
- itineraries
- trips
- enrollments
- payments
- subscriptions
- documents
- rooming
- notifications
- assistant
- support
- platform
- audit

## Regla de migracion

La logica antigua se lee, se entiende y se reimplementa en el bounded context correspondiente. No se trasladan carpetas legacy como arquitectura activa.
""",
    )
    write(
        ROOT / "infra" / "docker" / "service.Dockerfile",
        """FROM node:24-bookworm-slim AS deps
WORKDIR /workspace
COPY package*.json ./
COPY packages ./packages
COPY services ./services
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate && pnpm install

FROM node:24-bookworm-slim AS runtime
WORKDIR /workspace
ENV NODE_ENV=production
RUN addgroup --system totem && adduser --system --ingroup totem totem
COPY --from=deps /workspace /workspace
USER totem
CMD ["pnpm", "run", "start"]
""",
    )
    compose_services = []
    port = 4101
    for service in SERVICES:
        compose_services.append(
            f"""  {service}:
    build:
      context: .
      dockerfile: infra/docker/service.Dockerfile
    working_dir: /workspace/services/{service}
    command: pnpm dev
    environment:
      PORT: {port}
      DATABASE_URL: postgresql://${{POSTGRES_USER}}:${{POSTGRES_PASSWORD}}@postgres:5432/${{POSTGRES_DB}}?schema={service}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "{port}:{port}"
"""
        )
        port += 1
    write(
        ROOT / "docker-compose.yml",
        f"""services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${{POSTGRES_DB:?POSTGRES_DB is required}}
      POSTGRES_USER: ${{POSTGRES_USER:?POSTGRES_USER is required}}
      POSTGRES_PASSWORD: ${{POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}}
    ports:
      - "${{POSTGRES_PORT:-5432}}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgres/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${{POSTGRES_USER}} -d ${{POSTGRES_DB}}"]
      interval: 10s
      timeout: 5s
      retries: 10

  api-gateway:
    image: node:24-bookworm-slim
    working_dir: /workspace
    command: sh -c "corepack enable && corepack prepare pnpm@11.3.0 --activate && pnpm install && pnpm --filter @totem/api-gateway dev"
    volumes:
      - .:/workspace
    environment:
      PORT: 4100
      IDENTITY_URL: http://identity:4101
      TENANCY_URL: http://tenancy:4102
      CATALOG_URL: http://catalog:4103
      ITINERARIES_URL: http://itineraries:4104
      TRIPS_URL: http://trips:4105
      ENROLLMENTS_URL: http://enrollments:4106
      PAYMENTS_URL: http://payments:4107
      SUBSCRIPTIONS_URL: http://subscriptions:4108
      DOCUMENTS_URL: http://documents:4109
      ROOMING_URL: http://rooming:4110
      NOTIFICATIONS_URL: http://notifications:4111
      ASSISTANT_URL: http://assistant:4112
      SUPPORT_URL: http://support:4113
      PLATFORM_URL: http://platform:4114
      AUDIT_URL: http://audit:4115
    ports:
      - "4100:4100"

  web:
    image: node:24-bookworm-slim
    working_dir: /workspace
    command: sh -c "corepack enable && corepack prepare pnpm@11.3.0 --activate && pnpm install && pnpm --filter @totem/web dev"
    volumes:
      - .:/workspace
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:4100
    depends_on:
      - api-gateway
    ports:
      - "3001:3001"

{"".join(compose_services)}
volumes:
  postgres_data:
""",
    )


def verifier() -> None:
    write(
        ROOT / "tools" / "verify-architecture.mjs",
        """import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const forbiddenPaths = [
  "backend/apps",
  "backend/src/totem_hub",
  "frontend/components",
  "frontend/lib",
  "frontend/types"
];

for (const path of forbiddenPaths) {
  if (existsSync(path)) {
    throw new Error(`Forbidden legacy or monolith path exists: ${path}`);
  }
}

const required = ["apps/web", "apps/api-gateway", "packages/shared-kernel", "packages/service-runtime", "services"];
for (const path of required) {
  if (!existsSync(path)) {
    throw new Error(`Required active architecture path is missing: ${path}`);
  }
}

const serviceRequiredSubpaths = [
  "src/domain/entities.ts",
  "src/domain/events.ts",
  "src/domain/errors.ts",
  "src/application/commands.ts",
  "src/application/queries.ts",
  "src/application/use-cases.ts",
  "src/ports/repositories.ts",
  "src/adapters/http/routes.ts",
  "src/adapters/http/business-routes.ts",
  "src/adapters/prisma/repository.ts",
  "src/main.ts",
  "prisma/schema.prisma"
];

for (const service of readdirSync("services")) {
  const servicePath = join("services", service);
  if (!statSync(servicePath).isDirectory()) continue;
  for (const subpath of serviceRequiredSubpaths) {
    const requiredPath = join(servicePath, subpath);
    if (!existsSync(requiredPath)) {
      throw new Error(`${service} missing ${subpath}`);
    }
  }
}

function walk(dir) {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory() && (entry === "node_modules" || entry === "generated" || entry === "dist" || entry === ".next")) {
      return [];
    }
    return stat.isDirectory() ? walk(path) : [path];
  });
}

const files = [...walk("services"), ...walk("apps"), ...walk("packages")].filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"));
const forbiddenCodePatterns = [" as any", " as never", "@ts-ignore", "eslint-disable"];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const pattern of forbiddenCodePatterns) {
    if (text.includes(pattern)) {
      throw new Error(`Forbidden code pattern ${pattern}: ${file}`);
    }
  }
  if (file.includes("/domain/") && (text.includes("@prisma/client") || text.includes("node:http"))) {
    throw new Error(`Domain layer imports infrastructure: ${file}`);
  }
  if (file.includes("/application/") && text.includes("@prisma/client")) {
    throw new Error(`Application layer imports prisma: ${file}`);
  }
  if (file.includes("/ui/") && text.includes("fetch(")) {
    throw new Error(`UI layer performs direct fetch: ${file}`);
  }
}

console.log("[architecture] ok: ddd hexagonal microservices");
""",
    )


def main() -> None:
    shared_kernel()
    service_runtime()
    for name, cfg in SERVICES.items():
        service_files(name, cfg)
    web_app()
    docs_and_infra()
    verifier()


if __name__ == "__main__":
    main()
