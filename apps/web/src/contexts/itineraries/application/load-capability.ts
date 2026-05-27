import type { ItinerariesApiPort } from "../ports/api";

export class LoadItinerariesCapability {
  constructor(private readonly api: ItinerariesApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
