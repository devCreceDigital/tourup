import type { AuditCapability } from "../domain/capability";

export interface AuditApiPort {
  getCapability(): Promise<AuditCapability>;
}
