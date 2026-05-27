import type { DomainEvent } from "@totem/shared-kernel";

export type TenantEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "TenantCreated" | "TenantUpdated" | "TenantStatusChanged";
};
