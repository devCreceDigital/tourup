import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";
import { toJsonObject } from "@totem/shared-kernel";
import type { AssistantLead, AssistantMemory, AssistantMemoryScope, AssistantSearchHistory, ChatSession, LeadStatus, TripPlan } from "../../domain/chat-session.js";
import type { AssistantStats, ChatRepository, LeadListQuery, LeadListResult } from "../../ports/chat-repository.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid JSON payload.");
  }
  return value as Record<string, unknown>;
}

function asSession(payload: unknown): ChatSession {
  const data = record(payload);
  if (typeof data.id !== "string" || typeof data.sessionToken !== "string") {
    throw new Error("Invalid chat session payload.");
  }
  return {
    tenantId: null,
    businessId: null,
    userId: null,
    userEmail: null,
    ...data
  } as unknown as ChatSession;
}

function asLead(payload: unknown, row: { id: string; tenantId: string; sessionId: string | null; status: string; createdAt: Date }): AssistantLead {
  const data = record(payload);
  return {
    id: row.id,
    tenantId: row.tenantId,
    sessionId: row.sessionId,
    travelerName: String(data.travelerName ?? ""),
    travelerEmail: String(data.travelerEmail ?? ""),
    travelerMsg: String(data.travelerMsg ?? ""),
    intentData: (data.intentData as Record<string, unknown>) ?? {},
    matchedTripId: typeof data.matchedTripId === "string" ? data.matchedTripId : null,
    tripName: typeof data.tripName === "string" ? data.tripName : null,
    matchScore: typeof data.matchScore === "number" ? data.matchScore : 0,
    status: row.status as LeadStatus,
    createdAt: row.createdAt.toISOString()
  };
}

function asTrip(payload: unknown, row: { id: string; sessionId: string | null; shareToken: string; isPublic: boolean; createdAt: Date }): TripPlan {
  const data = record(payload);
  return {
    id: row.id,
    tenantId: typeof data.tenantId === "string" ? data.tenantId : null,
    userId: typeof data.userId === "string" ? data.userId : null,
    sessionId: row.sessionId,
    shareToken: row.shareToken,
    isPublic: row.isPublic,
    title: String(data.title ?? ""),
    destination: String(data.destination ?? ""),
    days: Number(data.days ?? 0),
    travelers: Number(data.travelers ?? 1),
    itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
    budget: data.budget === null || typeof data.budget === "object" ? (data.budget as Record<string, unknown> | null) : null,
    weather: data.weather === null || typeof data.weather === "object" ? (data.weather as Record<string, unknown> | null) : null,
    hotels: Array.isArray(data.hotels) ? data.hotels : [],
    createdAt: row.createdAt.toISOString()
  };
}

function asMemory(row: {
  id: string;
  tenantId: string;
  businessId: string | null;
  userId: string | null;
  userEmail: string | null;
  scope: string;
  kind: string;
  key: string;
  content: string;
  tags: unknown;
  embedding: unknown;
  importance: number;
  sourceType: string;
  sourceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AssistantMemory {
  const embedding = Array.isArray(row.embedding)
    ? row.embedding.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    : null;
  const scope: AssistantMemoryScope =
    row.scope === "tenant" || row.scope === "session" || row.scope === "lead" || row.scope === "user" ? row.scope : "user";
  return {
    id: row.id,
    tenantId: row.tenantId,
    businessId: row.businessId,
    userId: row.userId,
    userEmail: row.userEmail,
    scope,
    kind: row.kind,
    key: row.key,
    content: row.content,
    tags: record(row.tags),
    embedding,
    importance: row.importance,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function asSearchHistory(row: {
  id: string;
  tenantId: string;
  businessId: string | null;
  userId: string | null;
  userEmail: string | null;
  sessionId: string | null;
  query: string;
  destination: string | null;
  intent: string;
  entities: unknown;
  toolResults: unknown;
  embedding: unknown;
  createdAt: Date;
}): AssistantSearchHistory {
  const embedding = Array.isArray(row.embedding)
    ? row.embedding.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    : null;
  return {
    id: row.id,
    tenantId: row.tenantId,
    businessId: row.businessId,
    userId: row.userId,
    userEmail: row.userEmail,
    sessionId: row.sessionId,
    query: row.query,
    destination: row.destination,
    intent: row.intent,
    entities: record(row.entities),
    toolResults: Array.isArray(row.toolResults) ? row.toolResults as AssistantSearchHistory["toolResults"] : [],
    embedding,
    createdAt: row.createdAt.toISOString()
  };
}

function lexicalScore(text: string, memory: AssistantMemory): number {
  const words = new Set(text.toLowerCase().split(/[^a-z0-9áéíóúñ]+/i).filter((word) => word.length > 2));
  const haystack = `${memory.kind} ${memory.key} ${memory.content}`.toLowerCase();
  let score = memory.importance;
  for (const word of words) {
    if (haystack.includes(word)) score += 1;
  }
  return score;
}

function cosineScore(left: readonly number[] | null | undefined, right: readonly number[] | null): number {
  if (!left || !right || left.length === 0 || right.length === 0) return 0;
  const limit = Math.min(left.length, right.length);
  let dot = 0;
  let a = 0;
  let b = 0;
  for (let i = 0; i < limit; i++) {
    const x = left[i] ?? 0;
    const y = right[i] ?? 0;
    dot += x * y;
    a += x * x;
    b += y * y;
  }
  if (a === 0 || b === 0) return 0;
  return dot / (Math.sqrt(a) * Math.sqrt(b));
}

export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveSession(session: ChatSession): Promise<void> {
    await this.prisma.assistantSessionRecord.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        tenantId: session.tenantId,
        businessId: session.businessId,
        userId: session.userId,
        userEmail: session.userEmail,
        status: session.status,
        version: 1,
        payload: session as unknown as object
      },
      update: {
        tenantId: session.tenantId,
        businessId: session.businessId,
        userId: session.userId,
        userEmail: session.userEmail,
        status: session.status,
        payload: session as unknown as object
      }
    });
  }

  async findSessionById(id: string): Promise<ChatSession | null> {
    const row = await this.prisma.assistantSessionRecord.findFirst({ where: { id } });
    return row === null ? null : asSession(row.payload);
  }

  async findSessionByIdAndToken(id: string, sessionToken: string): Promise<ChatSession | null> {
    const session = await this.findSessionById(id);
    if (session === null || session.sessionToken !== sessionToken) return null;
    return session;
  }

  async findSessionByToken(sessionToken: string): Promise<ChatSession | null> {
    const rows = await this.prisma.assistantSessionRecord.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    for (const row of rows) {
      const session = asSession(row.payload);
      if (session.sessionToken === sessionToken) return session;
    }
    return null;
  }

  async countSessionsSince(since: Date): Promise<number> {
    return this.prisma.assistantSessionRecord.count({ where: { createdAt: { gte: since } } });
  }

  async saveLead(lead: AssistantLead): Promise<void> {
    const payload = toJsonObject({
      travelerName: lead.travelerName,
      travelerEmail: lead.travelerEmail,
      travelerMsg: lead.travelerMsg,
      intentData: lead.intentData,
      matchedTripId: lead.matchedTripId,
      tripName: lead.tripName,
      matchScore: lead.matchScore
    });
    await this.prisma.assistantLeadRecord.upsert({
      where: { id: lead.id },
      create: {
        id: lead.id,
        tenantId: lead.tenantId,
        sessionId: lead.sessionId,
        travelerEmail: lead.travelerEmail,
        status: lead.status,
        payload
      },
      update: {
        status: lead.status,
        payload
      }
    });
  }

  async findLeadById(id: string, tenantId: string): Promise<AssistantLead | null> {
    const row = await this.prisma.assistantLeadRecord.findFirst({ where: { id, tenantId } });
    return row === null ? null : asLead(row.payload, row);
  }

  async listLeads(query: LeadListQuery): Promise<LeadListResult> {
    const where = {
      tenantId: query.tenantId,
      ...(query.status === "all" ? {} : { status: query.status })
    };
    const [count, rows] = await Promise.all([
      this.prisma.assistantLeadRecord.count({ where }),
      this.prisma.assistantLeadRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      })
    ]);
    return { count, results: rows.map((row) => asLead(row.payload, row)) };
  }

  async updateLeadStatus(id: string, tenantId: string, status: LeadStatus): Promise<AssistantLead | null> {
    const existing = await this.findLeadById(id, tenantId);
    if (existing === null) return null;
    const updated = { ...existing, status };
    await this.saveLead(updated);
    return updated;
  }

  async leadExists(sessionId: string, email: string, tripId: string): Promise<boolean> {
    const rows = await this.prisma.assistantLeadRecord.findMany({
      where: { sessionId, travelerEmail: email.toLowerCase() },
      take: 20
    });
    return rows.some((row) => {
      const payload = record(row.payload);
      return payload.matchedTripId === tripId;
    });
  }

  async countLeads(): Promise<number> {
    return this.prisma.assistantLeadRecord.count();
  }

  async saveTripPlan(plan: TripPlan): Promise<void> {
    const payload = toJsonObject({
      title: plan.title,
      tenantId: plan.tenantId,
      userId: plan.userId,
      destination: plan.destination,
      days: plan.days,
      travelers: plan.travelers,
      itinerary: plan.itinerary,
      budget: plan.budget,
      weather: plan.weather,
      hotels: plan.hotels
    });
    await this.prisma.assistantTripPlanRecord.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        tenantId: plan.tenantId,
        userId: plan.userId,
        sessionId: plan.sessionId,
        shareToken: plan.shareToken,
        isPublic: plan.isPublic,
        payload
      },
      update: { payload, isPublic: plan.isPublic, tenantId: plan.tenantId, userId: plan.userId }
    });
  }

  async findTripByShareToken(shareToken: string): Promise<TripPlan | null> {
    const row = await this.prisma.assistantTripPlanRecord.findFirst({
      where: { shareToken, isPublic: true }
    });
    return row === null ? null : asTrip(row.payload, row);
  }

  async listPublicTrips(limit: number, tenantId?: string | null): Promise<readonly TripPlan[]> {
    const rows = await this.prisma.assistantTripPlanRecord.findMany({
      where: { isPublic: true, ...(tenantId === undefined ? {} : { tenantId }) },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    return rows.map((row) => asTrip(row.payload, row));
  }

  async countTripsSince(since: Date, tenantId?: string | null): Promise<number> {
    return this.prisma.assistantTripPlanRecord.count({ where: { createdAt: { gte: since }, ...(tenantId === undefined ? {} : { tenantId }) } });
  }

  async countTrips(tenantId?: string | null): Promise<number> {
    return this.prisma.assistantTripPlanRecord.count({ where: tenantId === undefined ? {} : { tenantId } });
  }

  async topDestinations(limit: number, tenantId?: string | null): Promise<readonly { destination: string; n: number }[]> {
    const trips = await this.listPublicTrips(100, tenantId);
    const counts = new Map<string, number>();
    for (const trip of trips) {
      const dest = trip.destination.trim();
      if (dest.length === 0 || dest.length >= 40) continue;
      counts.set(dest, (counts.get(dest) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([destination, n]) => ({ destination, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, limit);
  }

  async upsertMemory(memory: AssistantMemory): Promise<void> {
    const ownerKey = memory.userId ?? "tenant";
    await this.prisma.assistantMemoryRecord.upsert({
      where: {
        tenantId_ownerKey_scope_kind_key: {
          tenantId: memory.tenantId,
          ownerKey,
          scope: memory.scope,
          kind: memory.kind,
          key: memory.key
        }
      },
      create: {
        id: memory.id,
        tenantId: memory.tenantId,
        businessId: memory.businessId,
        userId: memory.userId,
        userEmail: memory.userEmail,
        ownerKey,
        scope: memory.scope,
        kind: memory.kind,
        key: memory.key,
        content: memory.content,
        tags: toJsonObject(memory.tags),
        embedding: memory.embedding === null ? Prisma.JsonNull : [...memory.embedding],
        importance: memory.importance,
        sourceType: memory.sourceType,
        sourceId: memory.sourceId
      },
      update: {
        businessId: memory.businessId,
        userEmail: memory.userEmail,
        content: memory.content,
        tags: toJsonObject(memory.tags),
        embedding: memory.embedding === null ? Prisma.JsonNull : [...memory.embedding],
        importance: memory.importance,
        sourceType: memory.sourceType,
        sourceId: memory.sourceId
      }
    });
  }

  async listMemories(query: { tenantId: string; userId?: string | null; limit: number; kinds?: readonly string[] }): Promise<readonly AssistantMemory[]> {
    const rows = await this.prisma.assistantMemoryRecord.findMany({
      where: {
        tenantId: query.tenantId,
        OR: [{ scope: "tenant" }, { userId: query.userId ?? null }],
        ...(query.kinds && query.kinds.length > 0 ? { kind: { in: [...query.kinds] } } : {})
      },
      orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
      take: query.limit
    });
    return rows.map(asMemory);
  }

  async searchMemories(query: { tenantId: string; userId?: string | null; text: string; limit: number; kinds?: readonly string[]; embedding?: readonly number[] | null }): Promise<readonly AssistantMemory[]> {
    const listQuery: { tenantId: string; userId?: string | null; limit: number; kinds?: readonly string[] } = {
      tenantId: query.tenantId,
      limit: Math.max(query.limit * 4, 20)
    };
    if (query.userId !== undefined) listQuery.userId = query.userId;
    if (query.kinds !== undefined) listQuery.kinds = query.kinds;
    const memories = await this.listMemories(listQuery);
    return [...memories]
      .map((memory) => ({ memory, score: lexicalScore(query.text, memory) + cosineScore(query.embedding, memory.embedding) * 3 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit)
      .map(({ memory }) => memory);
  }

  async countMemories(query: { tenantId: string; userId?: string | null }): Promise<number> {
    return this.prisma.assistantMemoryRecord.count({
      where: {
        tenantId: query.tenantId,
        ...(query.userId === undefined ? {} : { userId: query.userId })
      }
    });
  }

  async saveSearchHistory(search: AssistantSearchHistory): Promise<void> {
    await this.prisma.assistantSearchHistoryRecord.create({
      data: {
        id: search.id,
        tenantId: search.tenantId,
        businessId: search.businessId,
        userId: search.userId,
        userEmail: search.userEmail,
        sessionId: search.sessionId,
        query: search.query,
        destination: search.destination,
        intent: search.intent,
        entities: toJsonObject(search.entities),
        toolResults: toJsonObject(search.toolResults),
        embedding: search.embedding === null ? Prisma.JsonNull : [...search.embedding]
      }
    });
  }

  async listSearchHistory(query: { tenantId: string; userId?: string | null; sessionId?: string | null; limit: number }): Promise<readonly AssistantSearchHistory[]> {
    const rows = await this.prisma.assistantSearchHistoryRecord.findMany({
      where: {
        tenantId: query.tenantId,
        ...(query.userId === undefined ? {} : { userId: query.userId }),
        ...(query.sessionId === undefined ? {} : { sessionId: query.sessionId })
      },
      orderBy: { createdAt: "desc" },
      take: query.limit
    });
    return rows.map(asSearchHistory);
  }

  async getStats(tenantId?: string | null, userId?: string | null): Promise<AssistantStats> {
    const now = Date.now();
    const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const scopedTenantId = tenantId ?? undefined;
    const tenantWhere = scopedTenantId === undefined ? {} : { tenantId: scopedTenantId };
    const userWhere = userId === undefined ? tenantWhere : { ...tenantWhere, userId };
    const leadWhere = scopedTenantId === undefined ? {} : { tenantId: scopedTenantId };
    const [sessions, trips, leads, sessions7, sessions30, trips7, top, recentTrips, tenantMemory, userMemory] = await Promise.all([
      this.prisma.assistantSessionRecord.count({ where: userWhere }),
      this.countTrips(scopedTenantId),
      this.prisma.assistantLeadRecord.count({ where: leadWhere }),
      this.prisma.assistantSessionRecord.count({ where: { ...userWhere, createdAt: { gte: d7 } } }),
      this.prisma.assistantSessionRecord.count({ where: { ...userWhere, createdAt: { gte: d30 } } }),
      this.countTripsSince(d7, scopedTenantId),
      this.topDestinations(6, scopedTenantId),
      this.listPublicTrips(5, scopedTenantId),
      scopedTenantId === undefined ? Promise.resolve(0) : this.countMemories({ tenantId: scopedTenantId, userId: null }),
      scopedTenantId === undefined || userId === undefined || userId === null ? Promise.resolve(0) : this.countMemories({ tenantId: scopedTenantId, userId })
    ]);
    return {
      totals: { sessions, trips, leads },
      recent: { sessions_7d: sessions7, sessions_30d: sessions30, trips_7d: trips7 },
      top_destinations: top,
      memory: { tenant_items: tenantMemory, user_items: userMemory },
      recent_trips: recentTrips.map((t) => ({
        title: t.title || `Viaje a ${t.destination}`,
        destination: t.destination,
        days: t.days,
        travelers: t.travelers,
        budget_total: t.budget?.total_soles ?? null,
        share_token: t.shareToken,
        created_at: t.createdAt
      }))
    };
  }
}
