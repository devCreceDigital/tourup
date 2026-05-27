import type { SubscriptionsApiPort } from "../ports/api";
import type { SubscriptionsCapability } from "../domain/capability";

export class SubscriptionsServiceApi implements SubscriptionsApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<SubscriptionsCapability> {
    const response = await fetch(`${this.baseUrl}/subscriptions/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("subscriptions capability request failed.");
    }
    return response.json() as Promise<SubscriptionsCapability>;
  }
}
