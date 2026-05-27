import type { AuditApiPort } from "../ports/api";
import type { AuditCapability } from "../domain/capability";

export class AuditServiceApi implements AuditApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<AuditCapability> {
    const response = await fetch(`${this.baseUrl}/audit/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("audit capability request failed.");
    }
    return response.json() as Promise<AuditCapability>;
  }
}
