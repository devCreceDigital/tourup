import type { DomainEvent } from "@totem/shared-kernel";

export type AssistantSessionEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "AssistantSessionCreated" | "AssistantSessionUpdated" | "AssistantSessionStatusChanged";
};
