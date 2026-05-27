import type { IdentityApiPort } from "../ports/api";

export class LoadIdentityCapability {
  constructor(private readonly api: IdentityApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
