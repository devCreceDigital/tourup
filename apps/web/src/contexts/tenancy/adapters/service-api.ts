import type { TenancyApiPort } from "../ports/api";
import type { TenancyCapability } from "../domain/capability";

export class TenancyServiceApi implements TenancyApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<TenancyCapability> {
    const response = await fetch(`${this.baseUrl}/tenancy/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("tenancy capability request failed.");
    }
    return response.json() as Promise<TenancyCapability>;
  }
}
