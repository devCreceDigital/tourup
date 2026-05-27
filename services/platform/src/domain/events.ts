import type { DomainEvent } from "@totem/shared-kernel";

export type PlatformTenantViewEvent = DomainEvent<{
  readonly status: string;
  readonly version: number;
}> & {
  readonly eventType: "PlatformTenantViewCreated" | "PlatformTenantViewUpdated" | "PlatformTenantViewStatusChanged";
};
