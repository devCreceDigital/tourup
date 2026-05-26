import type { SupportApiPort } from "../ports/api";

export class LoadSupportCapability {
  constructor(private readonly api: SupportApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
