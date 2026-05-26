import type { DomainEvent } from "@totem/shared-kernel";

export type SubscriptionEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "SubscriptionCreated" | "SubscriptionUpdated" | "SubscriptionStatusChanged";
};
