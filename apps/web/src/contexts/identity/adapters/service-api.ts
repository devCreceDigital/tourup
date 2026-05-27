import type { IdentityApiPort } from "../ports/api";
import type { IdentityCapability } from "../domain/capability";

export class IdentityServiceApi implements IdentityApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<IdentityCapability> {
    const response = await fetch(`${this.baseUrl}/identity/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("identity capability request failed.");
    }
    return response.json() as Promise<IdentityCapability>;
  }
}
