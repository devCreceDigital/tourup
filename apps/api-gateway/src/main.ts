import { createServer, type IncomingHttpHeaders, type IncomingMessage } from "node:http";
import { assertRuntimeConfiguration, createLogger } from "@totem/service-runtime";
import { applyTrustedIdentityHeaders, authenticateGatewayRequest, isPublicPath } from "./auth.js";
import { loadServiceRegistry } from "./service-registry.js";
import { createGatewayRateLimiter, extractClientIp } from "./rate-limit.js";

assertRuntimeConfiguration("api-gateway");

const log = createLogger("api-gateway");
const rateLimiter = createGatewayRateLimiter();
const registry = loadServiceRegistry(process.env);
const port = Number(process.env.PORT ?? "4100");
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

type NodeRequestInit = RequestInit & {
  readonly duplex?: "half";
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin");
  if (origin !== null && (allowedOrigins.includes("*") || allowedOrigins.includes(origin))) {
    headers.set("access-control-allow-origin", allowedOrigins.includes("*") ? "*" : origin);
    headers.set("vary", "Origin");
  }
  headers.set("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  headers.set(
    "access-control-allow-headers",
    request.headers.get("access-control-request-headers") ??
      "authorization,content-type,x-request-id,x-tenant-id,x-user-email,x-user-id,x-user-role"
  );
  headers.set("access-control-max-age", "86400");
  return headers;
}

function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  corsHeaders(request).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function headersFromIncoming(headers: IncomingHttpHeaders): Headers {
  const normalized = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) normalized.append(key, entry);
    } else if (typeof value === "string") {
      normalized.set(key, value);
    }
  }
  return normalized;
}

async function readIncomingBody(request: IncomingMessage): Promise<ArrayBuffer | null> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return null;
  }
  const buffer = Buffer.concat(chunks);
  const body = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(body).set(buffer);
  return body;
}

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (url.pathname === "/health") {
    return json(200, { status: "ok", service: "api-gateway", architecture: "microservices" });
  }

  const route = registry.find((candidate) => url.pathname === candidate.prefix || url.pathname.startsWith(`${candidate.prefix}/`));
  if (route === undefined) {
    return json(404, { error: { code: "route_not_found", message: "No service route matches this path." } });
  }

  let principal;
  try {
    principal = await authenticateGatewayRequest(request, registry, process.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid authorization token.";
    return json(401, { error: { code: "unauthorized", message } });
  }

  // ── Rate limiting (después de auth, para usar userId como clave) ──────────
  try {
    await rateLimiter.assertAllowed(principal.userId, extractClientIp(request));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Too many requests.";
    const retryAfter = (error as { retryAfter?: number }).retryAfter;
    const headers = new Headers({ "retry-after": String(retryAfter ?? 60) });
    log.warn("Rate limit exceeded", {
      userId: principal.userId,
      path: url.pathname,
      retryAfter
    });
    return new Response(JSON.stringify({ error: { code: "rate_limit_exceeded", message } }), {
      status: 429,
      headers: Object.assign({ "content-type": "application/json; charset=utf-8" }, retryAfter !== undefined ? { "retry-after": String(retryAfter) } : {})
    });
  }

  const publicPath = isPublicPath(url.pathname);
  if (!publicPath && principal.role === "anonymous") {
    return json(401, { error: { code: "unauthorized", message: "Authentication is required." } });
  }

  const target = new URL(url.pathname + url.search, route.baseUrl);
  const init: NodeRequestInit = {
    method: request.method,
    headers: applyTrustedIdentityHeaders(request.headers, principal, process.env, publicPath),
    duplex: "half"
  };
  if (request.method !== "GET" && request.method !== "HEAD" && request.body !== null) {
    init.body = request.body;
  }
  const proxied = await fetch(target, init);

  return new Response(proxied.body, {
    status: proxied.status,
    statusText: proxied.statusText,
    headers: proxied.headers
  });
}

const server = createServer(async (incoming, outgoing) => {
  const method = incoming.method ?? "GET";
  const requestInit: NodeRequestInit = {
    method,
    headers: headersFromIncoming(incoming.headers),
    duplex: "half"
  };
  if (method !== "GET" && method !== "HEAD") {
    const body = await readIncomingBody(incoming);
    if (body !== null) {
      requestInit.body = body;
    }
  }
  const request = new Request(`http://localhost${incoming.url ?? "/"}`, requestInit);

  const response = await handle(request).catch((error) => {
    log.error("Gateway unhandled error", {
      error: error instanceof Error ? error : new Error(String(error)),
      url: incoming.url
    });
    const message = error instanceof Error ? error.message : "Unexpected gateway error.";
    return json(502, { error: { code: "gateway_error", message } });
  });
  const responseWithCors = withCors(request, response);

  outgoing.statusCode = responseWithCors.status;
  responseWithCors.headers.forEach((value, key) => outgoing.setHeader(key, value));
  if (responseWithCors.body === null) {
    outgoing.end();
    return;
  }
  const reader = responseWithCors.body.getReader();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    outgoing.write(Buffer.from(chunk.value));
  }
  outgoing.end();
});

server.listen(port, () => {
  log.info("Service started", { port });
});

const shutdown = (signal: NodeJS.Signals) => {
  log.info("Shutdown signal received; draining HTTP server", { signal });
  server.close((error) => {
    if (error) {
      log.error("Shutdown failed", { error: error instanceof Error ? error : new Error(String(error)) });
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => {
    log.error("Shutdown timed out; forcing exit");
    process.exit(1);
  }, 10_000).unref();
};

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
