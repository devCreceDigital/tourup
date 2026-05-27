import type { TenancyCapability } from "../domain/capability";

export interface TenancyApiPort {
  getCapability(): Promise<TenancyCapability>;
}
