import type { CatalogCapability } from "../domain/capability";

export interface CatalogApiPort {
  getCapability(): Promise<CatalogCapability>;
}
