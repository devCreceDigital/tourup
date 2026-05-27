import type { AssistantIntent } from "../../domain/chat-session.js";
import type { AssistantMemoryScope } from "../../domain/chat-session.js";

export type ChatCompletionMessage = {
  readonly role: "user" | "assistant" | "system";
  readonly content: string;
};

// ─── Config helpers ───────────────────────────────────────────────────────────

function baseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
}

function chatModel(): string {
  return process.env.ASSISTANT_MODEL ?? "gemma3:4b";
}

/** Heuristic (fast, deterministic) is default.
 *  Set ASSISTANT_CLASSIFIER_MODE=ollama to use LLM for higher accuracy at cost of latency. */
function classifierMode(): "heuristic" | "ollama" {
  return process.env.ASSISTANT_CLASSIFIER_MODE === "ollama" ? "ollama" : "heuristic";
}

function classifierModel(): string {
  return process.env.ASSISTANT_CLASSIFIER_MODEL ?? chatModel();
}

function embeddingModel(): string {
  return process.env.ASSISTANT_EMBEDDING_MODEL ?? "embeddinggemma";
}

function keepAlive(): string {
  return process.env.OLLAMA_KEEP_ALIVE ?? "10m";
}

function maxOutputTokens(): number {
  const value = Number(process.env.ASSISTANT_MAX_TOKENS ?? "420");
  if (!Number.isFinite(value)) return 420;
  return Math.max(64, Math.min(1024, Math.trunc(value)));
}

// ─── Parsing helpers ─────────────────────────────────────────────────────────

function objectPayload(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Ollama response is invalid.");
  }
  return value as Record<string, unknown>;
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) return {};
  try {
    return objectPayload(JSON.parse(trimmed.slice(start, end + 1)) as unknown);
  } catch {
    return {};
  }
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// ─── Heuristic intent classifier ─────────────────────────────────────────────
//
// Handles Spanish / English / Portuguese.
// Covers the main use-cases of Totem HUB: trip planning, booking, support,
// profile updates and general questions.

const DESTINATIONS_RE =
  /\b(cusco|machu picchu|lima|arequipa|puno|titicaca|ica|paracas|mancora|piura|tarapoto|iquitos|madre de dios|amazon[ía]|chachapoyas|trujillo|huaraz|peru|perú)\b/i;

const TRIP_WORDS_RE =
  /viaje|tour|destino|hotel|itinerario|ruta|agenda|vacacion|vacación|paquete|excursion|excursión|visitar|turismo|alojamiento|hospedaje|trip|travel|plan|voyage|séjour/i;

const BOOKING_WORDS_RE =
  /reserva|reservar|comprar|pagar|pago|cupo|disponibilidad|booking|book|confirmar|confirmacion|confirmación|plazas|asientos|fecha/i;

const SUPPORT_WORDS_RE =
  /ayuda|problema|reclamo|queja|error|falla|no funciona|soporte|support|issue|bug|help/i;

const PROFILE_WORDS_RE =
  /prefiero|me gusta|quiero guardar|recuerda|anota|preferencia|no me gusta|dieta|vegetar|alergias?|recuérdame|recuerdame/i;

const TRAVELERS_RE = /(\d{1,3})\s*(personas?|viajeros?|pasajeros?|pax|adultos?)/i;
const DAYS_RE = /(\d{1,2})\s*(d[íi]as?|days?|noches?|nights?)/i;
const BUDGET_RE = /(?:presupuesto|budget|usd|\$|soles|s\/)\s*([0-9][0-9.,]*)/i;
const TRIP_TYPE_RE = /\b(rom[áa]ntic[ao]|luna de miel|honeymoon|familiar|familia|family|aventura|adventure|solo|mochilero|backpack|playa|beach|sierra|selva|jungle|cultural|gastron[oó]m)/i;

function fallbackIntent(message: string): AssistantIntent {
  const lower = message.toLowerCase();
  const entities: Record<string, unknown> = {};

  const destination = lower.match(DESTINATIONS_RE)?.[0];
  if (destination) entities.destination = destination;

  const travelers = lower.match(TRAVELERS_RE)?.[1];
  if (travelers) entities.travelers = Number(travelers);

  const days = lower.match(DAYS_RE)?.[1];
  if (days) entities.days = Number(days);

  const budget = lower.match(BUDGET_RE)?.[1];
  if (budget) entities.budget = budget;

  const tripType = message.match(TRIP_TYPE_RE)?.[1];
  if (tripType) entities.trip_type = tripType.toLowerCase();

  const category =
    BOOKING_WORDS_RE.test(lower) ? "booking" :
    SUPPORT_WORDS_RE.test(lower) ? "support" :
    PROFILE_WORDS_RE.test(lower) ? "profile_update" :
    TRIP_WORDS_RE.test(lower) || destination !== undefined ? "trip_planning" :
    "general";

  const entityCount = Object.keys(entities).length;
  const confidence =
    entityCount >= 3 ? 0.82 :
    entityCount === 2 ? 0.72 :
    entityCount === 1 ? 0.62 :
    0.45;

  return {
    category,
    confidence,
    summary: message.slice(0, 240),
    entities,
    memories: Object.entries(entities).map(([key, value]) => ({
      scope: key === "destination" || key === "budget" || key === "trip_type"
        ? ("user" as AssistantMemoryScope)
        : ("session" as AssistantMemoryScope),
      kind: "preference",
      key,
      content: `${key}: ${String(value)}`,
      importance: key === "destination" ? 0.85 : key === "trip_type" ? 0.75 : 0.6,
      tags: { extractedBy: "heuristic" }
    }))
  };
}

function normalizeIntent(payload: Record<string, unknown>, fallback: AssistantIntent): AssistantIntent {
  const rawEntities = objectPayload(typeof payload.entities === "object" && payload.entities !== null ? payload.entities : {});
  const entities = { ...fallback.entities, ...rawEntities };
  const category = text(payload.category);
  const memories: AssistantIntent["memories"] = Array.isArray(payload.memories)
    ? payload.memories.flatMap((item) => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) return [];
        const row = item as Record<string, unknown>;
        const key = text(row.key);
        const content = text(row.content);
        if (key === null || content === null) return [];
        const scope: AssistantMemoryScope =
          row.scope === "tenant" || row.scope === "lead" || row.scope === "session" ? row.scope : "user";
        return [{
          scope,
          kind: text(row.kind) ?? "preference",
          key,
          content,
          importance: Math.max(0, Math.min(1, numberValue(row.importance) ?? 0.6)),
          tags: objectPayload(typeof row.tags === "object" && row.tags !== null ? row.tags : {})
        }];
      })
    : fallback.memories;
  return {
    category:
      category === "trip_planning" || category === "booking" || category === "support" ||
      category === "profile_update" || category === "tenant_knowledge" || category === "general"
        ? category
        : fallback.category,
    confidence: Math.max(0, Math.min(1, numberValue(payload.confidence) ?? fallback.confidence)),
    summary: text(payload.summary) ?? fallback.summary,
    entities,
    memories
  };
}

// ─── Ollama streaming helper ──────────────────────────────────────────────────

async function* streamOllama(
  model: string,
  messages: readonly ChatCompletionMessage[],
  options: { temperature: number; num_ctx: number; num_predict: number }
): AsyncGenerator<string> {
  const response = await fetch(`${baseUrl()}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      keep_alive: keepAlive(),
      options
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ollama chat failed (${response.status}): ${detail.slice(0, 240)}`);
  }

  if (response.body === null) throw new Error("Ollama returned empty body.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) continue;
        let chunk: Record<string, unknown>;
        try {
          chunk = objectPayload(JSON.parse(trimmed));
        } catch {
          continue;
        }
        const token = (chunk.message as Record<string, unknown> | undefined)?.content;
        if (typeof token === "string" && token.length > 0) yield token;
        if (chunk.done === true) return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── OllamaClient ─────────────────────────────────────────────────────────────

export class OllamaClient {
  /**
   * Streams the chat completion token by token.
   * Use this in the pipeline so the frontend receives tokens as they arrive.
   */
  stream(messages: readonly ChatCompletionMessage[]): AsyncGenerator<string> {
    return streamOllama(chatModel(), messages, {
      temperature: 0.25,
      num_ctx: 3072,
      num_predict: maxOutputTokens()
    });
  }

  /**
   * Blocking completion — kept for cases that need the full string before proceeding.
   */
  async complete(messages: readonly ChatCompletionMessage[]): Promise<string> {
    const chunks: string[] = [];
    for await (const token of this.stream(messages)) {
      chunks.push(token);
    }
    return chunks.join("");
  }

  /**
   * Classify the user message.
   * In heuristic mode (default): fast, deterministic regex-based classification.
   * In ollama mode: sends a compact prompt to the configured classifier model.
   */
  async classify(message: string): Promise<AssistantIntent> {
    const fallback = fallbackIntent(message);
    if (classifierMode() === "heuristic") {
      return fallback;
    }
    try {
      const content = await this.completeWithModel(classifierModel(), [
        {
          role: "system",
          content:
            "Classify the travel CRM message. Return compact JSON only: " +
            "{category,confidence,summary,entities:{destination?,days?,travelers?,budget?,trip_type?},memories:[]}. " +
            "category: trip_planning|booking|support|profile_update|general"
        },
        { role: "user", content: message }
      ], 0.05);
      return normalizeIntent(parseJsonObject(content), fallback);
    } catch {
      return fallback;
    }
  }

  /**
   * Generate an embedding vector for semantic memory retrieval.
   */
  async embed(input: string): Promise<readonly number[] | null> {
    try {
      const response = await fetch(`${baseUrl()}/api/embed`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: embeddingModel(), input })
      });
      if (!response.ok) return null;
      const payload = objectPayload(await response.json());
      const embeddings = payload.embeddings;
      if (!Array.isArray(embeddings) || !Array.isArray(embeddings[0])) return null;
      return (embeddings[0] as unknown[]).filter(
        (n): n is number => typeof n === "number" && Number.isFinite(n)
      );
    } catch {
      return null;
    }
  }

  /**
   * Pre-warm the chat model so the first real request is faster.
   * Fire-and-forget; errors are silently ignored.
   */
  warmUp(): void {
    fetch(`${baseUrl()}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: chatModel(),
        messages: [{ role: "user", content: "hi" }],
        stream: false,
        keep_alive: keepAlive(),
        options: { num_predict: 1, num_ctx: 128 }
      })
    }).catch(() => { /* warm-up is best-effort */ });
  }

  private async completeWithModel(
    model: string,
    messages: readonly ChatCompletionMessage[],
    temperature: number
  ): Promise<string> {
    const chunks: string[] = [];
    for await (const token of streamOllama(model, messages, {
      temperature,
      num_ctx: 1024,
      num_predict: 256
    })) {
      chunks.push(token);
    }
    return chunks.join("");
  }
}
