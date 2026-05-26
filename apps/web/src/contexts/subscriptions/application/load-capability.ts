import type { SubscriptionsApiPort } from "../ports/api";

export class LoadSubscriptionsCapability {
  constructor(private readonly api: SubscriptionsApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
