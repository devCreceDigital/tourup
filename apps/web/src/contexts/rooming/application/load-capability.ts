import type { RoomingApiPort } from "../ports/api";

export class LoadRoomingCapability {
  constructor(private readonly api: RoomingApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
