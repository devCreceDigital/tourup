import type { AssistantIntent, AssistantMemory } from "../domain/chat-session.js";
import type { TravelToolResult } from "./travel-tools.js";

export type NemoclawContext = {
  readonly summary: string;
  readonly memoryKeys: readonly string[];
  readonly toolNames: readonly string[];
  readonly cautions: readonly string[];
};

export function buildNemoclawContext(input: {
  readonly intent: AssistantIntent;
  readonly memories: readonly AssistantMemory[];
  readonly toolResults: readonly TravelToolResult[];
}): NemoclawContext {
  const memoryKeys = input.memories
    .slice()
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 6)
    .map((memory) => `${memory.scope}:${memory.kind}:${memory.key}`);
  const toolNames = input.toolResults.map((tool) => tool.tool_name);
  const estimatedTools = input.toolResults.filter((tool) => tool.result.source === "development_fallback_estimate").map((tool) => tool.tool_name);
  const cautions = [
    ...(estimatedTools.length > 0 ? [`Tools with estimates only: ${estimatedTools.join(", ")}`] : []),
    ...(input.intent.category === "booking" ? ["Never confirm booking, seat or payment without provider confirmation."] : [])
  ];
  const summary = [
    `intent=${input.intent.category}`,
    `confidence=${Math.round(input.intent.confidence * 100)}%`,
    `memories=${memoryKeys.length}`,
    `tools=${toolNames.length === 0 ? "none" : toolNames.join(",")}`
  ].join("; ");
  return { summary, memoryKeys, toolNames, cautions };
}
