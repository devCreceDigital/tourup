import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { parseTenantId, parseUserId, type TenantContext } from "@totem/shared-kernel";
import { defaultRateLimiter } from "./rate-limit.js";
import { runWithTenantContext } from "./prisma.js";
import { assertRuntimeConfiguration } from "./configuration.js";

export type JsonHandler = (request: JsonRequest) => Promise<unknown>;

export type JsonRequest = {
  readonly method: string;
  readonly path: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: URLSearchParams;
  readonly body: unknown;
  readonly context: TenantContext;
  readonly headers: IncomingMessage["headers"];
};

export type Route = {
  readonly method: string;
  readonly path: string;
  readonly handler: JsonHandler;
};

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

type RouteMatch = {
  readonly route: Route;
  readonly params: Readonly<Record<string, string>>;
};

export function createTenantContext(request: IncomingMessage): TenantContext {
  const configuredSecret = process.env.SERVICE_INTERNAL_SECRET;
  const internalSecret = request.headers["x-internal-service-secret"];
  const trustedInternalRequest =
    typeof configuredSecret === "string" &&
    configuredSecret.length > 0 &&
    typeof internalSecret === "string" &&
    internalSecret === configuredSecret;
  const tenantHeader = trustedInternalRequest ? request.headers["x-internal-tenant-id"] : undefined;
  const businessHeader = trustedInternalRequest ? request.headers["x-internal-business-id"] : undefined;
  const userHeader = trustedInternalRequest ? request.headers["x-internal-user-id"] : undefined;
  const emailHeader = trustedInternalRequest ? request.headers["x-internal-user-email"] : undefined;
  const roleHeader = trustedInternalRequest ? request.headers["x-internal-user-role"] : undefined;
  const publicHeader = trustedInternalRequest ? request.headers["x-internal-public-path"] : undefined;
  const requestHeader = request.headers["x-request-id"];

  return {
    tenantId: typeof tenantHeader === "string" && tenantHeader.length > 0 ? parseTenantId(tenantHeader) : null,
    businessId:
      typeof businessHeader === "string" && businessHeader.length > 0
        ? parseTenantId(businessHeader)
        : typeof tenantHeader === "string" && tenantHeader.length > 0
          ? parseTenantId(tenantHeader)
          : null,
    userId: typeof userHeader === "string" && userHeader.length > 0 ? parseUserId(userHeader) : null,
    userEmail: typeof emailHeader === "string" && emailHeader.length > 0 ? emailHeader : null,
    role: roleHeader === "superadmin" || roleHeader === "admin" || roleHeader === "viajero" || roleHeader === "system" ? roleHeader : "anonymous",
    requestId: typeof requestHeader === "string" && requestHeader.length > 0 ? requestHeader : randomUUID(),
    isPublic: publicHeader === "true"
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

function applyCors(request: IncomingMessage, response: ServerResponse): void {
  const origin = request.headers.origin;
  if (typeof origin === "string" && (allowedOrigins.includes("*") || allowedOrigins.includes(origin))) {
    response.setHeader("access-control-allow-origin", allowedOrigins.includes("*") ? "*" : origin);
    response.setHeader("vary", "Origin");
  }
  response.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  response.setHeader(
    "access-control-allow-headers",
    typeof request.headers["access-control-request-headers"] === "string"
      ? request.headers["access-control-request-headers"]
      : "authorization,content-type,x-request-id,x-tenant-id,x-user-email,x-user-id,x-user-role"
  );
  response.setHeader("access-control-max-age", "86400");
}

function matchRoutePath(pattern: string, actualPath: string): Readonly<Record<string, string>> | null {
  if (pattern === actualPath) return {};
  const patternParts = pattern.split("/").filter(Boolean);
  const actualParts = actualPath.split("/").filter(Boolean);
  if (patternParts.length !== actualParts.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = actualParts[index];
    if (expected === undefined || actual === undefined) return null;
    if (expected.startsWith(":")) {
      const key = expected.slice(1);
      if (key.length === 0) return null;
      params[key] = decodeURIComponent(actual);
      continue;
    }
    if (expected !== actual) return null;
  }
  return params;
}

function findRoute(routes: readonly Route[], method: string, path: string): RouteMatch | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchRoutePath(route.path, path);
    if (params !== null) return { route, params };
  }
  return null;
}

export function startHttpService(serviceName: string, routes: readonly Route[]): void {
  assertRuntimeConfiguration(serviceName);
  const port = Number(process.env.PORT ?? "3000");
  const limiter = defaultRateLimiter();
  const server = createServer(async (request, response) => {
    try {
      applyCors(request, response);
      const method = request.method ?? "GET";
      const url = new URL(request.url ?? "/", "http://localhost");
      const path = url.pathname;

      if (method === "OPTIONS") {
        response.statusCode = 204;
        response.end();
        return;
      }

      if (method === "GET" && path === "/health") {
        send(response, 200, { status: "ok", service: serviceName, architecture: "ddd-hexagonal-microservice" });
        return;
      }

      limiter.assertAllowed(request);
      const matchedRoute = findRoute(routes, method, path);
      if (matchedRoute === null) {
        send(response, 404, { error: { code: "not_found", message: "Route not found." } });
        return;
      }

      const body = await readBody(request);
      const context = createTenantContext(request);
      const payload = await runWithTenantContext(context, () => matchedRoute.route.handler({
        method,
        path,
        params: matchedRoute.params,
        query: url.searchParams,
        body,
        context,
        headers: request.headers
      }));
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
}
