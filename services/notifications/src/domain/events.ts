import type { DomainEvent } from "@totem/shared-kernel";

export type NotificationEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "NotificationCreated" | "NotificationUpdated" | "NotificationStatusChanged";
};
