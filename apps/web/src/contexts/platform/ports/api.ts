import type { PlatformCapability } from "../domain/capability";

export interface PlatformApiPort {
  getCapability(): Promise<PlatformCapability>;
}
