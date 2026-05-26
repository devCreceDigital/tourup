import type { DomainEvent } from "@totem/shared-kernel";

export type TripEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "TripCreated" | "TripUpdated" | "TripStatusChanged";
};
