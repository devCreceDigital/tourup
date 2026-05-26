import type { SupportApiPort } from "../ports/api";
import type { SupportCapability } from "../domain/capability";

export class SupportServiceApi implements SupportApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<SupportCapability> {
    const response = await fetch(`${this.baseUrl}/support/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("support capability request failed.");
    }
    return response.json() as Promise<SupportCapability>;
  }
}
