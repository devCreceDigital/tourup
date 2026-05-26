import type { EnrollmentsApiPort } from "../ports/api";

export class LoadEnrollmentsCapability {
  constructor(private readonly api: EnrollmentsApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
