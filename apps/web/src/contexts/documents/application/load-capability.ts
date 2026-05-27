import type { DocumentsApiPort } from "../ports/api";

export class LoadDocumentsCapability {
  constructor(private readonly api: DocumentsApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
