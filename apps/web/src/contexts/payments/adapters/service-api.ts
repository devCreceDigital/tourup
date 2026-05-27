import type { PaymentsApiPort } from "../ports/api";
import type { PaymentsCapability } from "../domain/capability";

export class PaymentsServiceApi implements PaymentsApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<PaymentsCapability> {
    const response = await fetch(`${this.baseUrl}/payments/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("payments capability request failed.");
    }
    return response.json() as Promise<PaymentsCapability>;
  }
}
