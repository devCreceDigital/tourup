export type ChatLanguage = "es" | "en" | "pt";

export type ChatSessionStatus = "active" | "expired" | "completed";

export type ChatMessageTurn = {
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly ts: string;
  readonly tool_results?: readonly { tool_name: string; result: unknown }[];
};

export type ChatSession = {
  readonly id: string;
  readonly tenantId: string | null;
  readonly businessId: string | null;
  readonly userId: string | null;
  readonly userEmail: string | null;
  readonly sessionToken: string;
  readonly language: ChatLanguage;
  readonly status: ChatSessionStatus;
  readonly intentData: Record<string, unknown>;
  readonly messages: readonly ChatMessageTurn[];
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly userName: string;
};

export type AssistantMemoryScope = "tenant" | "user" | "session" | "lead";

export type AssistantMemory = {
  readonly id: string;
  readonly tenantId: string;
  readonly businessId: string | null;
  readonly userId: string | null;
  readonly userEmail: string | null;
  readonly scope: AssistantMemoryScope;
  readonly kind: string;
  readonly key: string;
  readonly content: string;
  readonly tags: Record<string, unknown>;
  readonly embedding: readonly number[] | null;
  readonly importance: number;
  readonly sourceType: string;
  readonly sourceId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type AssistantSearchHistory = {
  readonly id: string;
  readonly tenantId: string;
  readonly businessId: string | null;
  readonly userId: string | null;
  readonly userEmail: string | null;
  readonly sessionId: string | null;
  readonly query: string;
  readonly destination: string | null;
  readonly intent: string;
  readonly entities: Record<string, unknown>;
  readonly toolResults: readonly { tool_name: string; result: unknown }[];
  readonly embedding: readonly number[] | null;
  readonly createdAt: string;
};

export type AssistantIntent = {
  readonly category: "trip_planning" | "booking" | "support" | "profile_update" | "tenant_knowledge" | "general";
  readonly confidence: number;
  readonly summary: string;
  readonly entities: Record<string, unknown>;
  readonly memories: readonly Pick<AssistantMemory, "scope" | "kind" | "key" | "content" | "importance" | "tags">[];
};

export type LeadStatus = "new" | "contacted" | "converted" | "closed";

export type AssistantLead = {
  readonly id: string;
  readonly tenantId: string;
  readonly sessionId: string | null;
  readonly travelerName: string;
  readonly travelerEmail: string;
  readonly travelerMsg: string;
  readonly intentData: Record<string, unknown>;
  readonly matchedTripId: string | null;
  readonly tripName: string | null;
  readonly matchScore: number;
  readonly status: LeadStatus;
  readonly createdAt: string;
};

export type TripPlan = {
  readonly id: string;
  readonly tenantId: string | null;
  readonly userId: string | null;
  readonly sessionId: string | null;
  readonly shareToken: string;
  readonly isPublic: boolean;
  readonly title: string;
  readonly destination: string;
  readonly days: number;
  readonly travelers: number;
  readonly itinerary: unknown[];
  readonly budget: Record<string, unknown> | null;
  readonly weather: Record<string, unknown> | null;
  readonly hotels: unknown[];
  readonly createdAt: string;
};

export type MatchResult = {
  readonly trip_id: string;
  readonly company_id: string;
  readonly itinerary_id: string;
  readonly agency_name: string;
  readonly agency_rating: number | null;
  readonly trip_name: string;
  readonly duration_days: number;
  readonly next_departure: string;
  readonly price_from: number;
  readonly currency: string;
  readonly available_seats: number;
  readonly match_score: number;
  readonly semantic_score: number;
  readonly highlights: readonly string[];
};

export type SseEvent = Record<string, unknown>;
