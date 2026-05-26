import type { PlatformApiPort } from "../ports/api";

export class LoadPlatformCapability {
  constructor(private readonly api: PlatformApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
