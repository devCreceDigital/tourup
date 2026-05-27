import type { IdentityCapability } from "../domain/capability";

export interface IdentityApiPort {
  getCapability(): Promise<IdentityCapability>;
}
