import type { CatalogApiPort } from "../ports/api";

export class LoadCatalogCapability {
  constructor(private readonly api: CatalogApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
