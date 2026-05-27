import type { PaymentsApiPort } from "../ports/api";

export class LoadPaymentsCapability {
  constructor(private readonly api: PaymentsApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
