import type { ItinerariesApiPort } from "../ports/api";
import type { ItinerariesCapability } from "../domain/capability";

export class ItinerariesServiceApi implements ItinerariesApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<ItinerariesCapability> {
    const response = await fetch(`${this.baseUrl}/itineraries/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("itineraries capability request failed.");
    }
    return response.json() as Promise<ItinerariesCapability>;
  }
}
