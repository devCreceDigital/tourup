import type { PaymentsCapability } from "../domain/capability";

export interface PaymentsApiPort {
  getCapability(): Promise<PaymentsCapability>;
}
