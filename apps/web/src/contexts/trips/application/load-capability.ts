import type { TripsApiPort } from "../ports/api";

export class LoadTripsCapability {
  constructor(private readonly api: TripsApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
