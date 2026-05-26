import type { AssistantApiPort } from "../ports/api";
import type { AssistantCapability } from "../domain/capability";

export class AssistantServiceApi implements AssistantApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<AssistantCapability> {
    const response = await fetch(`${this.baseUrl}/assistant/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("assistant capability request failed.");
    }
    return response.json() as Promise<AssistantCapability>;
  }
}
