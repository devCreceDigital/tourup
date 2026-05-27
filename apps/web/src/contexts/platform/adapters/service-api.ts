import type { PlatformApiPort } from "../ports/api";
import type { PlatformCapability } from "../domain/capability";

export class PlatformServiceApi implements PlatformApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<PlatformCapability> {
    const response = await fetch(`${this.baseUrl}/platform/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("platform capability request failed.");
    }
    return response.json() as Promise<PlatformCapability>;
  }
}
