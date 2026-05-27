import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { requireTenant, tenantScope } from "@totem/shared-kernel";
import type { AssistantLead, AssistantSession } from "../domain/assistant.js";

export interface AssistantRepository {
  findSessionById(id: EntityId): Promise<AssistantSession | null>;
  saveSession(session: AssistantSession, idempotencyKey?: IdempotencyKey): Promise<void>;
  saveLead(lead: AssistantLead, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export interface AiCompletionPort {
  complete(input: { messages: readonly { role: "user" | "assistant" | "system"; content: string }[] }): Promise<string>;
}

export class CreateAssistantLead {
  constructor(private readonly assistant: AssistantRepository) {}

  async execute(lead: AssistantLead, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<AssistantLead> {
    const tenantId: TenantId = context.isPublic ? lead.tenantId : tenantScope(context, lead.tenantId) ?? requireTenant(context);
    const owned: AssistantLead = { ...lead, tenantId, status: "new" };
    await this.assistant.saveLead(owned, idempotencyKey);
    return owned;
  }
}

export class StartAssistantSession {
  constructor(private readonly assistant: AssistantRepository) {}

  async execute(session: AssistantSession, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<AssistantSession> {
    const owned: AssistantSession = { ...session, tenantId: context.tenantId, status: "active" };
    await this.assistant.saveSession(owned, idempotencyKey);
    return owned;
  }
}

export class SendAssistantMessage {
  constructor(
    private readonly assistant: AssistantRepository,
    private readonly ai: AiCompletionPort
  ) {}

  async execute(input: { sessionId: EntityId; message: string }, context: TenantContext): Promise<{ sessionId: EntityId; answer: string }> {
    const session = await this.assistant.findSessionById(input.sessionId);
    if (session === null) throw new Error("Assistant session not found.");
    if (session.tenantId !== null && context.tenantId !== null && session.tenantId !== context.tenantId) {
      throw new Error("Assistant session belongs to another tenant.");
    }
    if (session.status !== "active") throw new Error("Assistant session is not active.");
    const answer = await this.ai.complete({
      messages: [
        { role: "system", content: "Eres el asistente comercial de Totem HUB. Responde en español, con precisión operativa y sin prometer disponibilidad no verificada." },
        { role: "user", content: input.message }
      ]
    });
    return { sessionId: session.id, answer };
  }
}
