import type {
  AssistantIntent,
  AssistantMemory,
  ChatLanguage,
  ChatMessageTurn,
  SseEvent
} from "../domain/chat-session.js";
import type { OllamaClient } from "../adapters/ai/ollama-client.js";
import { buildNemoclawContext } from "./nemoclaw-context.js";
import type { TravelToolResult } from "./travel-tools.js";

// ─── Pipeline step labels ─────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { agent: "intent",   label: "Clasificando intención y entidades" },
  { agent: "memory",   label: "Recuperando memoria del tenant y usuario" },
  { agent: "planner",  label: "Cruzando contexto operativo" },
  { agent: "composer", label: "Redactando respuesta local" }
] as const;

// ─── SSE helper ───────────────────────────────────────────────────────────────

function sse(event: SseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// ─── Tool result summarizer ───────────────────────────────────────────────────
//
// Converts full JSON tool results into compact human-readable summaries.
// This dramatically reduces the number of tokens sent to the LLM.

function summarizeToolResult(tool: TravelToolResult): string {
  const r = tool.result;
  const dest = typeof r.destination === "string" ? r.destination : "";

  switch (tool.tool_name) {
    case "generate_itinerary": {
      const days = typeof r.days === "number" ? r.days : "?";
      const items = Array.isArray(r.itinerary) ? r.itinerary : [];
      const dayLines = (items as Record<string, unknown>[])
        .slice(0, 4)
        .map((d) => `Día ${d.day}: ${d.title ?? d.morning ?? ""}`)
        .join("; ");
      return `Itinerario ${days} días en ${dest}: ${dayLines}`;
    }
    case "calculate_budget": {
      const total = r.total;
      const currency = r.currency ?? "USD";
      const travelers = r.travelers ?? "?";
      const days = r.days ?? "?";
      return `Presupuesto estimado: ${total} ${currency} para ${travelers} pax, ${days} días en ${dest}`;
    }
    case "buscar_lugares": {
      const items = Array.isArray(r.items) ? r.items : [];
      const names = (items as Record<string, unknown>[])
        .slice(0, 3)
        .map((p) => String(p.name ?? (p.displayName as Record<string,unknown>|undefined)?.text ?? ""))
        .filter(Boolean)
        .join(", ");
      return `Atracciones en ${dest}: ${names || "datos no disponibles"}`;
    }
    case "buscar_restaurantes": {
      const items = Array.isArray(r.items) ? r.items : [];
      const names = (items as Record<string, unknown>[])
        .slice(0, 3)
        .map((p) => String(p.name ?? ""))
        .filter(Boolean)
        .join(", ");
      return `Restaurantes en ${dest}: ${names || "datos no disponibles"}`;
    }
    case "calcular_ruta": {
      const route = Array.isArray(r.route) ? r.route : [];
      const segs = (route as Record<string, unknown>[])
        .slice(0, 3)
        .map((s) => `Día ${s.day}: ${s.segment}`)
        .join("; ");
      return `Ruta hacia ${dest}: ${segs || "ruta estimada"}`;
    }
    case "buscar_vuelos": {
      const opts = Array.isArray(r.options) ? r.options : [];
      const first = (opts[0] as Record<string, unknown> | undefined);
      if (first) {
        return `Vuelos a ${dest} (${r.travelers ?? "?"} pax): ${first.cabin} ${first.price_band} – ventana ${first.booking_window}`;
      }
      return `Vuelos a ${dest}: consultar disponibilidad con proveedor`;
    }
    default:
      return `${tool.tool_name}: ${JSON.stringify(r).slice(0, 160)}`;
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────
//
// Kept compact to minimize token count without losing essential context.

function systemPrompt(
  language: ChatLanguage,
  intent: AssistantIntent,
  memories: readonly AssistantMemory[],
  toolResults: readonly TravelToolResult[]
): string {
  const lang = language === "en" ? "English" : language === "pt" ? "Portuguese" : "Spanish";

  const memoryBlock =
    memories.length === 0
      ? "none"
      : memories
          .slice(0, 8)
          .map((m) => `${m.key}: ${m.content}`)
          .join("; ");

  const toolBlock =
    toolResults.length === 0
      ? "none"
      : toolResults.map((t) => summarizeToolResult(t)).join(" | ");

  const isFallback = toolResults.some((t) => String(t.result.source).includes("estimate"));

  return [
    `You are Totem HUB, AI assistant for a multi-tenant travel agency platform. Reply in ${lang}. Be concise, warm and actionable.`,
    "Rules: never invent confirmed bookings or live availability; acknowledge destination/days/group/budget; treat memories as soft context.",
    isFallback ? "Note: some tool results are development estimates — present them as such." : "",
    `Intent: ${intent.category} (${Math.round(intent.confidence * 100)}%). ${intent.summary.slice(0, 160)}`,
    `User memory: ${memoryBlock}`,
    `Tools: ${toolBlock}`
  ].filter(Boolean).join("\n");
}

// ─── Deterministic fallback ───────────────────────────────────────────────────
//
// Used only when the local LLM is completely unreachable.

function valueText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function fallbackAssistantAnswer(input: {
  readonly language: ChatLanguage;
  readonly content: string;
  readonly intent: AssistantIntent;
  readonly toolResults: readonly TravelToolResult[];
}): string {
  const itinerary = input.toolResults.find((t) => t.tool_name === "generate_itinerary")?.result;
  const destination =
    valueText(input.intent.entities.destination) ??
    valueText(itinerary?.destination) ??
    "Peru";
  const days =
    typeof itinerary?.days === "number" ? itinerary.days :
    typeof input.intent.entities.days === "number" ? input.intent.entities.days : 4;

  if (input.language === "en") {
    return (
      `I can help you plan a ${days}-day trip to ${destination}. ` +
      "For a personalized itinerary with live availability, the local AI model needs to be running. " +
      "Please check that Ollama is up and the model has been downloaded."
    );
  }
  if (input.language === "pt") {
    return (
      `Posso te ajudar a planejar uma viagem de ${days} dias para ${destination}. ` +
      "Para um itinerário personalizado com disponibilidade real, o modelo de IA local precisa estar rodando."
    );
  }
  return (
    `Puedo ayudarte a armar un viaje de ${days} días a ${destination}. ` +
    "Para una respuesta personalizada y con disponibilidad real necesito que el modelo Ollama esté activo. " +
    "Verifica que el contenedor Ollama esté corriendo y que el modelo haya sido descargado."
  );
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function* runChatPipeline(input: {
  readonly language: ChatLanguage;
  readonly content: string;
  readonly history: readonly ChatMessageTurn[];
  readonly intentData: Record<string, unknown>;
  readonly intent: AssistantIntent;
  readonly memories: readonly AssistantMemory[];
  readonly toolResults?: readonly TravelToolResult[];
  readonly ai: OllamaClient;
}): AsyncGenerator<string> {
  // Emit pipeline steps upfront so the frontend can show progress
  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    const step = PIPELINE_STEPS[i]!;
    yield sse({ type: "pipeline_progress", step: i + 1, total: PIPELINE_STEPS.length, agent: step.agent, label: step.label });
  }

  const toolResults = input.toolResults ?? [];
  const nemoclaw = buildNemoclawContext({ intent: input.intent, memories: input.memories, toolResults });
  yield sse({ type: "nemoclaw_context", summary: nemoclaw.summary, memory_keys: nemoclaw.memoryKeys, cautions: nemoclaw.cautions });

  for (const tool of toolResults) {
    yield sse({ type: "tool_result", tool_name: tool.tool_name, result: tool.result });
  }

  const messages = [
    {
      role: "system" as const,
      content: `${systemPrompt(input.language, input.intent, input.memories, toolResults)}\nNemoclaw: ${nemoclaw.summary}`
    },
    ...input.history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: input.content }
  ];

  // Stream tokens as they arrive from Ollama — user sees output immediately
  try {
    let hasContent = false;
    for await (const token of input.ai.stream(messages)) {
      hasContent = true;
      yield sse({ type: "token", content: token });
    }
    if (!hasContent) throw new Error("Ollama returned empty response.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local AI model unavailable.";
    yield sse({ type: "assistant_notice", message });
    const fallback = fallbackAssistantAnswer({
      language: input.language,
      content: input.content,
      intent: input.intent,
      toolResults
    });
    yield sse({ type: "token", content: fallback });
  }

  yield sse({ type: "done" });
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export function isSessionExpired(expiresAt: string): boolean {
  return Date.parse(expiresAt) <= Date.now();
}

export function buildWelcomeMessage(userName: string, language: ChatLanguage): string {
  const greeting =
    language === "en" ? "Hello" :
    language === "pt" ? "Olá" :
    "Hola";
  const intro =
    language === "en" ? "I am your travel assistant." :
    language === "pt" ? "Sou seu assistente de viagens." :
    "soy tu asistente de viajes.";
  const name = userName.trim();
  return name.length > 0 ? `${greeting} ${name}, ${intro}` : `${greeting}, ${intro}`;
}

