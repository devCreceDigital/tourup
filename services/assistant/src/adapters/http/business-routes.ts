import { randomUUID } from "node:crypto";
import { parseEntityId, parseIdempotencyKey, parseTenantId } from "@totem/shared-kernel";
import type { Route } from "@totem/service-runtime";
import { CreateAssistantLead, SendAssistantMessage, StartAssistantSession, type AiCompletionPort, type AssistantRepository } from "../../application/assistant-use-cases.js";
import type { AssistantLead, AssistantSession } from "../../domain/assistant.js";
import { OllamaClient } from "../ai/ollama-client.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${key} is required.`);
  return value.trim();
}

function optionalEntity(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? parseEntityId(value) : null;
}

class OllamaCompletionPort implements AiCompletionPort {
  private readonly client = new OllamaClient();

  async complete(input: Parameters<AiCompletionPort["complete"]>[0]): Promise<string> {
    return this.client.complete(input.messages);
  }
}

export function createAssistantBusinessRoutes(repository: AssistantRepository): readonly Route[] {
  const startSession = new StartAssistantSession(repository);
  const sendMessage = new SendAssistantMessage(repository, new OllamaCompletionPort());
  const createLead = new CreateAssistantLead(repository);

  return [
    {
      method: "POST",
      path: "/assistant/sessions",
      handler: async (request) => {
        const body = record(request.body);
        const session: AssistantSession = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId,
          token: typeof body.token === "string" ? body.token : randomUUID(),
          language: body.language === "en" ? "en" : "es",
          status: "active",
          intentData: typeof body.intentData === "object" && body.intentData !== null && !Array.isArray(body.intentData) ? body.intentData as Record<string, unknown> : {}
        };
        const idempotencyKey =
          typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${session.id}:assistant-session`);
        return startSession.execute(session, idempotencyKey, request.context);
      }
    },
    {
      method: "POST",
      path: "/assistant/messages",
      handler: async (request) => {
        const body = record(request.body);
        return sendMessage.execute({ sessionId: parseEntityId(text(body, "sessionId")), message: text(body, "message") }, request.context);
      }
    },
    {
      method: "POST",
      path: "/assistant/leads",
      handler: async (request) => {
        const body = record(request.body);
        const lead: AssistantLead = {
          id: typeof body.id === "string" ? parseEntityId(body.id) : parseEntityId(randomUUID()),
          tenantId: request.context.tenantId ?? parseTenantId(text(body, "tenantId")),
          travelerName: text(body, "travelerName"),
          travelerEmail: text(body, "travelerEmail").toLowerCase(),
          message: typeof body.message === "string" ? body.message : null,
          matchedTripId: optionalEntity(body.matchedTripId),
          status: "new"
        };
        const idempotencyKey =
          typeof body.idempotencyKey === "string" ? parseIdempotencyKey(body.idempotencyKey) : parseIdempotencyKey(`${lead.tenantId}:${lead.travelerEmail}:assistant-lead`);
        return createLead.execute(lead, idempotencyKey, request.context);
      }
    }
  ];
}
