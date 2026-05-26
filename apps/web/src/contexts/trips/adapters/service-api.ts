import type { TripsApiPort } from "../ports/api";
import type { TripsCapability } from "../domain/capability";

export class TripsServiceApi implements TripsApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<TripsCapability> {
    const response = await fetch(`${this.baseUrl}/trips/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("trips capability request failed.");
    }
    return response.json() as Promise<TripsCapability>;
  }
}
