import type { TenancyApiPort } from "../ports/api";

export class LoadTenancyCapability {
  constructor(private readonly api: TenancyApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
