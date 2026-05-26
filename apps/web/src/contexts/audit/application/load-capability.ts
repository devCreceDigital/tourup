import type { AuditApiPort } from "../ports/api";

export class LoadAuditCapability {
  constructor(private readonly api: AuditApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
