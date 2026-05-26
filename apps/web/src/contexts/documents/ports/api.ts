import type { DocumentsCapability } from "../domain/capability";

export interface DocumentsApiPort {
  getCapability(): Promise<DocumentsCapability>;
}
