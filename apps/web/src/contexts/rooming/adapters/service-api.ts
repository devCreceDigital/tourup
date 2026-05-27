import type { RoomingCapability } from "../domain/capability";
import type { RoomingApiPort } from "../ports/api";

export class RoomingServiceApi implements RoomingApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<RoomingCapability> {
    const response = await fetch(`${this.baseUrl}/rooming/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("rooming capability request failed.");
    }
    return response.json() as Promise<RoomingCapability>;
  }
}
