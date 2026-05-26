import type { SubscriptionsCapability } from "../domain/capability";

export interface SubscriptionsApiPort {
  getCapability(): Promise<SubscriptionsCapability>;
}
