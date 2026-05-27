import type { ItinerariesCapability } from "../domain/capability";

export interface ItinerariesApiPort {
  getCapability(): Promise<ItinerariesCapability>;
}
