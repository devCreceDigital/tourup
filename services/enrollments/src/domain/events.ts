import type { DomainEvent } from "@totem/shared-kernel";

export type EnrollmentEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "EnrollmentCreated" | "EnrollmentUpdated" | "EnrollmentStatusChanged";
};
