import type { EnrollmentsCapability } from "../domain/capability";

export interface EnrollmentsApiPort {
  getCapability(): Promise<EnrollmentsCapability>;
}
