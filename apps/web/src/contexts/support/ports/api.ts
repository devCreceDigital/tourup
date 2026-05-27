import type { SupportCapability } from "../domain/capability";

export interface SupportApiPort {
  getCapability(): Promise<SupportCapability>;
}
