import type { TripsCapability } from "../domain/capability";

export interface TripsApiPort {
  getCapability(): Promise<TripsCapability>;
}
