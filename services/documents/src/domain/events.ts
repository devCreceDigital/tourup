import type { DomainEvent } from "@totem/shared-kernel";

export type TravelerDocumentEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "TravelerDocumentCreated" | "TravelerDocumentUpdated" | "TravelerDocumentStatusChanged";
};
