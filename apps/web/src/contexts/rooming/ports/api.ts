import type { RoomingCapability } from "../domain/capability";

export interface RoomingApiPort {
  getCapability(): Promise<RoomingCapability>;
}
