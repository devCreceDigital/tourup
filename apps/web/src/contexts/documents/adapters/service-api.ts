import type { DocumentsApiPort } from "../ports/api";
import type { DocumentsCapability } from "../domain/capability";

export class DocumentsServiceApi implements DocumentsApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<DocumentsCapability> {
    const response = await fetch(`${this.baseUrl}/documents/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("documents capability request failed.");
    }
    return response.json() as Promise<DocumentsCapability>;
  }
}
