import type { AssistantLead, AssistantMemory, AssistantSearchHistory, ChatSession, LeadStatus, TripPlan } from "../domain/chat-session.js";

export type LeadListQuery = {
  readonly tenantId: string;
  readonly status: LeadStatus | "all";
  readonly page: number;
  readonly pageSize: number;
};

export type LeadListResult = {
  readonly count: number;
  readonly results: readonly AssistantLead[];
};

export type AssistantStats = {
  readonly totals: { sessions: number; trips: number; leads: number };
  readonly recent: { sessions_7d: number; sessions_30d: number; trips_7d: number };
  readonly top_destinations: readonly { destination: string; n: number }[];
  readonly memory: { tenant_items: number; user_items: number };
  readonly recent_trips: readonly Record<string, unknown>[];
};

export interface ChatRepository {
  saveSession(session: ChatSession): Promise<void>;
  findSessionById(id: string): Promise<ChatSession | null>;
  findSessionByIdAndToken(id: string, sessionToken: string): Promise<ChatSession | null>;
  findSessionByToken(sessionToken: string): Promise<ChatSession | null>;
  countSessionsSince(since: Date): Promise<number>;
  saveLead(lead: AssistantLead): Promise<void>;
  findLeadById(id: string, tenantId: string): Promise<AssistantLead | null>;
  listLeads(query: LeadListQuery): Promise<LeadListResult>;
  updateLeadStatus(id: string, tenantId: string, status: LeadStatus): Promise<AssistantLead | null>;
  leadExists(sessionId: string, email: string, tripId: string): Promise<boolean>;
  countLeads(): Promise<number>;
  saveTripPlan(plan: TripPlan): Promise<void>;
  findTripByShareToken(shareToken: string): Promise<TripPlan | null>;
  listPublicTrips(limit: number, tenantId?: string | null): Promise<readonly TripPlan[]>;
  countTripsSince(since: Date, tenantId?: string | null): Promise<number>;
  countTrips(tenantId?: string | null): Promise<number>;
  topDestinations(limit: number, tenantId?: string | null): Promise<readonly { destination: string; n: number }[]>;
  upsertMemory(memory: AssistantMemory): Promise<void>;
  listMemories(query: { tenantId: string; userId?: string | null; limit: number; kinds?: readonly string[] }): Promise<readonly AssistantMemory[]>;
  searchMemories(query: { tenantId: string; userId?: string | null; text: string; limit: number; kinds?: readonly string[]; embedding?: readonly number[] | null }): Promise<readonly AssistantMemory[]>;
  countMemories(query: { tenantId: string; userId?: string | null }): Promise<number>;
  saveSearchHistory(search: AssistantSearchHistory): Promise<void>;
  listSearchHistory(query: { tenantId: string; userId?: string | null; sessionId?: string | null; limit: number }): Promise<readonly AssistantSearchHistory[]>;
  getStats(tenantId?: string | null, userId?: string | null): Promise<AssistantStats>;
}
