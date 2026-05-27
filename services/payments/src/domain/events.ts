import type { DomainEvent } from "@totem/shared-kernel";

export type PaymentEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "PaymentCreated" | "PaymentUpdated" | "PaymentStatusChanged";
};
