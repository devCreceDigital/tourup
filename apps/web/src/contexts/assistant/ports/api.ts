import type { AssistantCapability } from "../domain/capability";

export interface AssistantApiPort {
  getCapability(): Promise<AssistantCapability>;
}
