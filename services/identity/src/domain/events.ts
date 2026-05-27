import type { DomainEvent } from "@totem/shared-kernel";

export type ProfileEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "ProfileCreated" | "ProfileUpdated" | "ProfileStatusChanged";
};
