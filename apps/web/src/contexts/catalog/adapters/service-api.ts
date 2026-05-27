import type { CatalogApiPort } from "../ports/api";
import type { CatalogCapability } from "../domain/capability";

export class CatalogServiceApi implements CatalogApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<CatalogCapability> {
    const response = await fetch(`${this.baseUrl}/catalog/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("catalog capability request failed.");
    }
    return response.json() as Promise<CatalogCapability>;
  }
}
