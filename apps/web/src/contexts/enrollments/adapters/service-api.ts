import type { EnrollmentsApiPort } from "../ports/api";
import type { EnrollmentsCapability } from "../domain/capability";

export class EnrollmentsServiceApi implements EnrollmentsApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<EnrollmentsCapability> {
    const response = await fetch(`${this.baseUrl}/enrollments/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("enrollments capability request failed.");
    }
    return response.json() as Promise<EnrollmentsCapability>;
  }
}
