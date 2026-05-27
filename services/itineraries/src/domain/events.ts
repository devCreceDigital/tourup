import type { DomainEvent } from "@totem/shared-kernel";

export type ItineraryEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "ItineraryCreated" | "ItineraryUpdated" | "ItineraryStatusChanged";
};
