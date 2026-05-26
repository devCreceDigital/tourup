import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { URL } from "node:url";
import { parseTenantId, parseUserId, type Role, type TenantContext } from "@totem/shared-kernel";
import { runWithTenantContext } from "@totem/service-runtime";
import type { AssistantIntent, AssistantMemory, AssistantSearchHistory, ChatLanguage, ChatSession } from "../../domain/chat-session.js";
import { buildWelcomeMessage, isSessionExpired, runChatPipeline } from "../../application/chat-pipeline.js";
import { runTravelTools } from "../../application/travel-tools.js";
import type { ChatRepository } from "../../ports/chat-repository.js";
import { OllamaClient } from "../ai/ollama-client.js";
import { generateTripPlanPdf } from "../pdf/trip-plan-pdf.js";
import { defaultDemoTenantId, resolveBusinessId, resolveTenantId, resolveUserEmail, resolveUserId } from "./tenant-context.js";

type RouteHandler = (
  request: IncomingMessage,
  response: ServerResponse,
  params: Record<string, string>,
  body: unknown
) => Promise<void>;

type RouteDef = {
  readonly method: string;
  readonly pattern: RegExp;
  readonly handler: RouteHandler;
};

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function sendJson(response: ServerResponse, status: number, body: unknown): void {
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

function readRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("Request body must be an object.");
  }
  return body as Record<string, unknown>;
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (raw.length === 0) return null;
  return JSON.parse(raw) as unknown;
}

function sessionHours(): number {
  return Number(process.env.ASSISTANT_SESSION_HOURS ?? "24");
}

function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

function trustedRole(request: IncomingMessage): Role {
  const configuredSecret = process.env.SERVICE_INTERNAL_SECRET;
  const internalSecret = request.headers["x-internal-service-secret"];
  if (typeof configuredSecret !== "string" || configuredSecret.length === 0 || internalSecret !== configuredSecret) return "anonymous";
  const value = request.headers["x-internal-user-role"];
  return value === "superadmin" || value === "admin" || value === "viajero" || value === "system" ? value : "anonymous";
}

function createAssistantTenantContext(request: IncomingMessage): TenantContext {
  const tenantId = resolveTenantId(request.headers);
  const businessId = resolveBusinessId(request.headers);
  const userId = resolveUserId(request.headers);
  const requestId = request.headers["x-request-id"];
  return {
    tenantId: tenantId === null ? null : parseTenantId(tenantId),
    businessId: businessId === null ? null : parseTenantId(businessId),
    userId: userId === null ? null : parseUserId(userId),
    userEmail: resolveUserEmail(request.headers),
    role: trustedRole(request),
    requestId: typeof requestId === "string" && requestId.length > 0 ? requestId : randomUUID(),
    isPublic: false
  };
}

async function persistIntentMemories(input: {
  readonly ai: OllamaClient;
  readonly repository: ChatRepository;
  readonly session: ChatSession;
  readonly intent: AssistantIntent;
  readonly content: string;
}): Promise<void> {
  if (input.session.tenantId === null) return;
  for (const memory of input.intent.memories.slice(0, 12)) {
    const content = memory.content.trim();
    if (content.length < 3) continue;
    const scope = memory.scope === "tenant" ? "tenant" : memory.scope === "lead" ? "lead" : memory.scope === "session" ? "session" : "user";
    const ownerUserId = scope === "tenant" ? null : input.session.userId;
    const embedding = await input.ai.embed(`${memory.kind} ${memory.key} ${content}`);
    const now = new Date().toISOString();
    const row: AssistantMemory = {
      id: randomUUID(),
      tenantId: input.session.tenantId,
      businessId: input.session.businessId,
      userId: ownerUserId,
      userEmail: scope === "tenant" ? null : input.session.userEmail,
      scope,
      kind: memory.kind,
      key: memory.key,
      content,
      tags: { ...memory.tags, intent: input.intent.category, sourceText: input.content.slice(0, 500) },
      embedding,
      importance: memory.importance,
      sourceType: "chat_message",
      sourceId: input.session.id,
      createdAt: now,
      updatedAt: now
    };
    await input.repository.upsertMemory(row);
  }
}

async function persistSearchHistory(input: {
  readonly ai: OllamaClient;
  readonly repository: ChatRepository;
  readonly session: ChatSession;
  readonly intent: AssistantIntent;
  readonly content: string;
  readonly toolResults: readonly { tool_name: string; result: unknown }[];
  readonly embedding: readonly number[] | null;
}): Promise<void> {
  if (input.session.tenantId === null) return;
  const destination = typeof input.intent.entities.destination === "string" ? input.intent.entities.destination : null;
  const now = new Date().toISOString();
  const search: AssistantSearchHistory = {
    id: randomUUID(),
    tenantId: input.session.tenantId,
    businessId: input.session.businessId,
    userId: input.session.userId,
    userEmail: input.session.userEmail,
    sessionId: input.session.id,
    query: input.content,
    destination,
    intent: input.intent.category,
    entities: input.intent.entities,
    toolResults: input.toolResults,
    embedding: input.embedding,
    createdAt: now
  };
  await input.repository.saveSearchHistory(search);
  await input.repository.upsertMemory({
    id: randomUUID(),
    tenantId: input.session.tenantId,
    businessId: input.session.businessId,
    userId: input.session.userId,
    userEmail: input.session.userEmail,
    scope: input.session.userId === null ? "session" : "user",
    kind: "search_history",
    key: `last:${input.intent.category}`,
    content: destination === null ? input.content.slice(0, 500) : `Busco ${destination}: ${input.content.slice(0, 420)}`,
    tags: { intent: input.intent.category, entities: input.intent.entities, source: "assistant_search_history" },
    embedding: input.embedding ?? await input.ai.embed(input.content),
    importance: 0.75,
    sourceType: "search_history",
    sourceId: input.session.id,
    createdAt: now,
    updatedAt: now
  });
}

function matchRoute(method: string, pathname: string, routes: readonly RouteDef[]): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (match === null) continue;
    const params: Record<string, string> = {};
    if (match.groups) {
      for (const [key, value] of Object.entries(match.groups)) {
        if (typeof value === "string") params[key] = value;
      }
    }
    if (match[1] !== undefined && !params.id) params.id = match[1];
    if (match[1] !== undefined && !params.token) params.token = match[1];
    return { handler: route.handler, params };
  }
  return null;
}

export function startAssistantHttpServer(serviceName: string, repository: ChatRepository): void {
  const ai = new OllamaClient();
  const port = Number(process.env.PORT ?? "4112");

  // Pre-warm the model after a short delay to avoid blocking startup
  setTimeout(() => ai.warmUp(), 3000);

  const routes: RouteDef[] = [
    {
      method: "GET",
      pattern: /^\/assistant\/capability\/?$/,
      handler: async (_req, res) => {
        sendJson(res, 200, {
          service: "assistant",
          aggregate: "ChatSession",
          capability: "local-ollama sessions messages memories tenant-dashboard leads trip-plans stats agency-leads"
        });
      }
    },
    {
      method: "POST",
      pattern: /^\/assistant\/sessions$/,
      handler: async (req, res, _params, body) => {
        const data = readRecord(body);
        const language = data.language === "en" || data.language === "pt" ? data.language : "es";
        const userName = typeof data.user_name === "string" ? data.user_name : "";
        const tenantId = resolveTenantId(req.headers);
        const businessId = resolveBusinessId(req.headers);
        const userId = resolveUserId(req.headers);
        const userEmail = resolveUserEmail(req.headers);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + sessionHours() * 60 * 60 * 1000);
        const session: ChatSession = {
          id: randomUUID(),
          tenantId,
          businessId,
          userId,
          userEmail,
          sessionToken: createSessionToken(),
          language,
          status: "active",
          intentData: {},
          messages: [],
          expiresAt: expiresAt.toISOString(),
          createdAt: now.toISOString(),
          userName
        };
        const welcome = buildWelcomeMessage(userName, language);
        const withWelcome: ChatSession = {
          ...session,
          messages: [{ role: "assistant", content: welcome, ts: now.toISOString() }]
        };
        await repository.saveSession(withWelcome);
        sendJson(res, 201, {
          session_id: withWelcome.id,
          session_token: withWelcome.sessionToken,
          welcome_message: welcome,
          language,
          expires_at: withWelcome.expiresAt
        });
      }
    },
    {
      method: "POST",
      pattern: /^\/assistant\/sessions\/([^/]+)\/message\/?$/,
      handler: async (_req, res, params, body) => {
        const data = readRecord(body);
        const sessionToken = typeof data.session_token === "string" ? data.session_token : "";
        const content = typeof data.content === "string" ? data.content.trim() : "";
        if (sessionToken.length === 0 || content.length === 0) {
          sendJson(res, 400, { error: "session_token y content son requeridos" });
          return;
        }
        const session = await repository.findSessionByIdAndToken(params.id!, sessionToken);
        if (session === null) {
          sendJson(res, 400, { error: "sesión inválida" });
          return;
        }
        if (isSessionExpired(session.expiresAt)) {
          await repository.saveSession({ ...session, status: "expired" });
          sendJson(res, 400, { error: "sesión expirada" });
          return;
        }

        res.statusCode = 200;
        res.setHeader("content-type", "text/event-stream; charset=utf-8");
        res.setHeader("cache-control", "no-cache");
        res.setHeader("connection", "keep-alive");
        res.setHeader("x-accel-buffering", "no");

        const now = new Date().toISOString();
        const userTurn = { role: "user" as const, content, ts: now };

        try {
          const intent = await ai.classify(content);
          await persistIntentMemories({ ai, repository, session, intent, content });
          const queryEmbedding = await ai.embed(content);
          const memories = session.tenantId === null
            ? []
            : await repository.searchMemories({ tenantId: session.tenantId, userId: session.userId, text: content, limit: 10, embedding: queryEmbedding });
          const toolResults = await runTravelTools({ content, session, intent });
          await persistSearchHistory({ ai, repository, session, intent, content, toolResults, embedding: queryEmbedding });
          let answer = "";
          for await (const chunk of runChatPipeline({
            language: session.language,
            content,
            history: session.messages,
            intentData: session.intentData,
            intent,
            memories,
            toolResults,
            ai
          })) {
            res.write(chunk);
            const line = chunk.trim();
            if (line.startsWith("data:")) {
              try {
                const event = JSON.parse(line.slice(5).trim()) as { type?: string; content?: string };
                if (event.type === "token" && typeof event.content === "string") {
                  answer += event.content;
                }
              } catch {
                // ignore malformed sse chunk
              }
            }
          }
          const updatedMessages = [
            ...session.messages,
            { ...userTurn, tool_results: toolResults },
            {
              role: "assistant" as const,
              content: answer || "Gracias por tu mensaje. ¿Qué más te gustaría planear?",
              ts: new Date().toISOString()
            }
          ];
          await repository.saveSession({
            ...session,
            messages: updatedMessages,
            intentData: { ...session.intentData, ...intent.entities, last_message: content, last_intent: intent.category }
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error interno";
          res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
        }
        res.end();
      }
    },
    {
      method: "POST",
      pattern: /^\/assistant\/leads\/simple\/?$/,
      handler: async (_req, res, _params, body) => {
        const data = readRecord(body);
        const sessionToken = typeof data.session_token === "string" ? data.session_token : "";
        const travelerName = typeof data.traveler_name === "string" ? data.traveler_name.trim() : "";
        const travelerEmail = typeof data.traveler_email === "string" ? data.traveler_email.trim().toLowerCase() : "";
        const travelerMsg = typeof data.traveler_msg === "string" ? data.traveler_msg : "";
        if (!sessionToken || !travelerName || !travelerEmail) {
          sendJson(res, 400, { error: "Faltan campos requeridos" });
          return;
        }
        const session = await repository.findSessionByToken(sessionToken);
        if (session === null) {
          sendJson(res, 400, { error: "Sesión inválida" });
          return;
        }
        const leadId = randomUUID();
        await repository.saveLead({
          id: leadId,
          tenantId: session.tenantId ?? resolveTenantId(_req.headers) ?? defaultDemoTenantId(),
          sessionId: session.id,
          travelerName,
          travelerEmail,
          travelerMsg,
          intentData: session.intentData,
          matchedTripId: null,
          tripName: null,
          matchScore: 0,
          status: "new",
          createdAt: new Date().toISOString()
        });
        sendJson(res, 201, { lead_id: leadId });
      }
    },
    {
      method: "POST",
      pattern: /^\/assistant\/leads\/?$/,
      handler: async (_req, res, _params, body) => {
        const data = readRecord(body);
        const sessionToken = typeof data.session_token === "string" ? data.session_token : "";
        const travelerName = typeof data.traveler_name === "string" ? data.traveler_name.trim() : "";
        const travelerEmail = typeof data.traveler_email === "string" ? data.traveler_email.trim().toLowerCase() : "";
        const tripId = typeof data.trip_id === "string" ? data.trip_id : "";
        if (!sessionToken || !travelerName || !travelerEmail || !tripId) {
          sendJson(res, 400, { error: "Faltan campos requeridos" });
          return;
        }
        const session = await repository.findSessionByToken(sessionToken);
        if (session === null) {
          sendJson(res, 400, { error: "session inválida" });
          return;
        }
        if (await repository.leadExists(session.id, travelerEmail, tripId)) {
          sendJson(res, 409, { error: "lead duplicado" });
          return;
        }
        const leadId = randomUUID();
        const matchScore = typeof data.match_score === "number" ? data.match_score : 0;
        await repository.saveLead({
          id: leadId,
          tenantId: session.tenantId ?? resolveTenantId(_req.headers) ?? defaultDemoTenantId(),
          sessionId: session.id,
          travelerName,
          travelerEmail,
          travelerMsg: typeof data.traveler_msg === "string" ? data.traveler_msg : "",
          intentData: session.intentData,
          matchedTripId: tripId,
          tripName: typeof data.trip_name === "string" ? data.trip_name : null,
          matchScore,
          status: "new",
          createdAt: new Date().toISOString()
        });
        sendJson(res, 201, { lead_id: leadId, message: "Lead creado correctamente" });
      }
    },
    {
      method: "GET",
      pattern: /^\/assistant\/agency\/leads\/?$/,
      handler: async (req, res) => {
        const tenantId = resolveTenantId(req.headers);
        if (tenantId === null) {
          sendJson(res, 200, { count: 0, next: null, previous: null, results: [] });
          return;
        }
        const url = new URL(req.url ?? "/", "http://localhost");
        const statusParam = url.searchParams.get("status") ?? "all";
        const status =
          statusParam === "new" || statusParam === "contacted" || statusParam === "converted" || statusParam === "closed"
            ? statusParam
            : "all";
        const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
        const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("page_size") ?? "25")));
        const listed = await repository.listLeads({ tenantId, status, page, pageSize });
        sendJson(res, 200, {
          count: listed.count,
          next: listed.count > page * pageSize ? page + 1 : null,
          previous: page > 1 ? page - 1 : null,
          results: listed.results.map((lead) => ({
            id: lead.id,
            traveler_name: lead.travelerName,
            traveler_email: lead.travelerEmail,
            intent_data: lead.intentData,
            trip_name: lead.tripName ?? "Consulta general",
            match_score: lead.matchScore,
            status: lead.status,
            created_at: lead.createdAt
          }))
        });
      }
    },
    {
      method: "GET",
      pattern: /^\/assistant\/agency\/leads\/([^/]+)\/?$/,
      handler: async (req, res, params) => {
        const tenantId = resolveTenantId(req.headers);
        if (tenantId === null) {
          sendJson(res, 404, { error: "lead no encontrado" });
          return;
        }
        const lead = await repository.findLeadById(params.id!, tenantId);
        if (lead === null) {
          sendJson(res, 404, { error: "lead no encontrado" });
          return;
        }
        sendJson(res, 200, {
          id: lead.id,
          company_id: lead.tenantId,
          session: lead.sessionId,
          traveler_name: lead.travelerName,
          traveler_email: lead.travelerEmail,
          traveler_msg: lead.travelerMsg,
          intent_data: lead.intentData,
          matched_trip_id: lead.matchedTripId,
          trip_name: lead.tripName,
          match_score: lead.matchScore,
          status: lead.status,
          created_at: lead.createdAt
        });
      }
    },
    {
      method: "PATCH",
      pattern: /^\/assistant\/agency\/leads\/([^/]+)\/status\/?$/,
      handler: async (req, res, params, body) => {
        return updateLeadStatus(req, res, params, body, repository);
      }
    },
    {
      method: "POST",
      pattern: /^\/assistant\/agency\/leads\/([^/]+)\/status\/?$/,
      handler: async (req, res, params, body) => {
        return updateLeadStatus(req, res, params, body, repository);
      }
    },
    {
      method: "POST",
      pattern: /^\/assistant\/trips\/?$/,
      handler: async (req, res, _params, body) => {
        const data = readRecord(body);
        const sessionToken = typeof data.session_token === "string" ? data.session_token : "";
        const session = sessionToken.length > 0 ? await repository.findSessionByToken(sessionToken) : null;
        const intent = session?.intentData ?? {};
        const shareToken = randomBytes(8).toString("hex");
        const plan = {
          id: randomUUID(),
          tenantId: session?.tenantId ?? resolveTenantId(req.headers),
          userId: session?.userId ?? resolveUserId(req.headers),
          sessionId: session?.id ?? null,
          shareToken,
          isPublic: true,
          title: typeof data.title === "string" ? data.title : `Viaje a ${String(intent.destination ?? "Perú")}`,
          destination: typeof data.destination === "string" ? data.destination : String(intent.destination ?? ""),
          days: typeof data.days === "number" ? data.days : Number(intent.duration ?? 0),
          travelers: typeof data.travelers === "number" ? data.travelers : Number(intent.group_size ?? 1),
          itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
          budget: typeof data.budget === "object" && data.budget !== null ? (data.budget as Record<string, unknown>) : null,
          weather: typeof data.weather === "object" && data.weather !== null ? (data.weather as Record<string, unknown>) : null,
          hotels: Array.isArray(data.hotels) ? data.hotels : [],
          createdAt: new Date().toISOString()
        };
        await repository.saveTripPlan(plan);
        sendJson(res, 201, {
          trip_id: plan.id,
          share_token: shareToken,
          share_url: `/trip/${shareToken}`
        });
      }
    },
    {
      method: "GET",
      pattern: /^\/assistant\/trips-list\/?$/,
      handler: async (req, res) => {
        const tenantId = resolveTenantId(req.headers);
        const trips = await repository.listPublicTrips(20, tenantId === null ? undefined : tenantId);
        sendJson(res, 200, {
          trips: trips.map((trip) => ({
            share_token: trip.shareToken,
            title: trip.title || `Viaje a ${trip.destination}`,
            destination: trip.destination,
            days: trip.days,
            travelers: trip.travelers,
            budget_total: trip.budget?.total_soles ?? null,
            weather_temp: trip.weather?.temperature ?? null,
            days_count: trip.itinerary.length > 0 ? trip.itinerary.length : trip.days,
            created_at: trip.createdAt
          })),
          total: trips.length
        });
      }
    },
    {
      method: "GET",
      pattern: /^\/assistant\/trips\/([^/]+)\/?$/,
      handler: async (_req, res, params) => {
        const token = params.token ?? params.id ?? "";
        if (token.endsWith("/pdf")) return;
        const trip = await repository.findTripByShareToken(token);
        if (trip === null) {
          sendJson(res, 404, { error: "Trip no encontrado" });
          return;
        }
        sendJson(res, 200, {
          trip_id: trip.id,
          title: trip.title,
          destination: trip.destination,
          days: trip.days,
          travelers: trip.travelers,
          itinerary: trip.itinerary,
          budget: trip.budget,
          weather: trip.weather,
          hotels: trip.hotels,
          created_at: trip.createdAt
        });
      }
    },
    {
      method: "GET",
      pattern: /^\/assistant\/trips\/([^/]+)\/pdf\/?$/,
      handler: async (_req, res, params) => {
        const trip = await repository.findTripByShareToken(params.token ?? params.id ?? "");
        if (trip === null) {
          sendJson(res, 404, { error: "Trip no encontrado" });
          return;
        }
        const pdf = generateTripPlanPdf(trip);
        res.statusCode = 200;
        res.setHeader("content-type", "application/pdf");
        res.setHeader("content-disposition", `attachment; filename="viaje-${trip.destination || "totem"}-${trip.shareToken.slice(0, 8)}.pdf"`);
        res.end(pdf);
      }
    },
    {
      method: "GET",
      pattern: /^\/assistant\/stats$/,
      handler: async (req, res) => {
        const stats = await repository.getStats(resolveTenantId(req.headers) ?? undefined, resolveUserId(req.headers) ?? undefined);
        sendJson(res, 200, stats);
      }
    },
    {
      method: "GET",
      pattern: /^\/assistant\/tenant-dashboard$/,
      handler: async (req, res) => {
        const tenantId = resolveTenantId(req.headers);
        if (tenantId === null) {
          sendJson(res, 403, { error: "tenant context is required" });
          return;
        }
        const userId = resolveUserId(req.headers);
        const [stats, memories] = await Promise.all([
          repository.getStats(tenantId, userId),
          repository.listMemories({ tenantId, userId, limit: 20 })
        ]);
        sendJson(res, 200, {
          tenant_id: tenantId,
          user_id: userId,
          stats,
          memory: memories.map((memory) => ({
            id: memory.id,
            scope: memory.scope,
            kind: memory.kind,
            key: memory.key,
            content: memory.content,
            importance: memory.importance,
            updated_at: memory.updatedAt
          }))
        });
      }
    },
    {
      method: "GET",
      pattern: /^\/assistant\/memory$/,
      handler: async (req, res) => {
        const tenantId = resolveTenantId(req.headers);
        if (tenantId === null) {
          sendJson(res, 403, { error: "tenant context is required" });
          return;
        }
        const url = new URL(req.url ?? "/", "http://localhost");
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
        const memories = await repository.listMemories({ tenantId, userId: resolveUserId(req.headers), limit });
        sendJson(res, 200, {
          results: memories.map((memory) => ({
            id: memory.id,
            scope: memory.scope,
            kind: memory.kind,
            key: memory.key,
            content: memory.content,
            tags: memory.tags,
            importance: memory.importance,
            updated_at: memory.updatedAt
          }))
        });
      }
    },
    {
      method: "GET",
      pattern: /^\/assistant\/search-history$/,
      handler: async (req, res) => {
        const tenantId = resolveTenantId(req.headers);
        if (tenantId === null) {
          sendJson(res, 403, { error: "tenant context is required" });
          return;
        }
        const url = new URL(req.url ?? "/", "http://localhost");
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
        const userId = resolveUserId(req.headers);
        const results = await repository.listSearchHistory({ tenantId, userId, limit });
        sendJson(res, 200, {
          tenant_id: tenantId,
          user_id: userId,
          results: results.map((item) => ({
            id: item.id,
            query: item.query,
            destination: item.destination,
            intent: item.intent,
            entities: item.entities,
            tool_results: item.toolResults,
            created_at: item.createdAt
          }))
        });
      }
    }
  ];

  const server = createServer(async (request, response) => {
    try {
      applyCors(request, response);
      const method = request.method ?? "GET";
      let pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      if (pathname.length > 1 && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
      }

      if (method === "OPTIONS") {
        response.statusCode = 204;
        response.end();
        return;
      }

      if (method === "GET" && pathname === "/health") {
        sendJson(response, 200, { status: "ok", service: serviceName, architecture: "ddd-hexagonal-microservice" });
        return;
      }

      const matched = matchRoute(method, pathname, routes);
      if (matched === null) {
        sendJson(response, 404, { error: { code: "not_found", message: "Route not found." } });
        return;
      }

      const body = method === "GET" || method === "HEAD" ? null : await readBody(request);
      await runWithTenantContext(createAssistantTenantContext(request), () => matched.handler(request, response, matched.params, body));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error.";
      if (!response.headersSent) {
        sendJson(response, 400, { error: { code: "request_failed", message } });
      } else {
        response.end();
      }
    }
  });

  server.listen(port, () => {
    console.log(`${serviceName} listening on ${port}`);
  });
}

async function updateLeadStatus(
  request: IncomingMessage,
  response: ServerResponse,
  params: Record<string, string>,
  body: unknown,
  repository: ChatRepository
): Promise<void> {
  const tenantId = resolveTenantId(request.headers);
  if (tenantId === null) {
    sendJson(response, 403, { error: "no autorizado" });
    return;
  }
  const data = readRecord(body);
  const status = data.status;
  if (status !== "new" && status !== "contacted" && status !== "converted" && status !== "closed") {
    sendJson(response, 400, { error: "status inválido" });
    return;
  }
  const updated = await repository.updateLeadStatus(params.id!, tenantId, status);
  if (updated === null) {
    sendJson(response, 404, { error: "lead no encontrado" });
    return;
  }
  sendJson(response, 200, { id: updated.id, status: updated.status });
}
