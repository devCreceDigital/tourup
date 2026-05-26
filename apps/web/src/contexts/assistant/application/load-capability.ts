import type { AssistantApiPort } from "../ports/api";

export class LoadAssistantCapability {
  constructor(private readonly api: AssistantApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
