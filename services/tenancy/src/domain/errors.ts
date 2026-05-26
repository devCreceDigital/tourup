export class TenantDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantDomainError";
  }
}

export class TenantInvariantViolation extends TenantDomainError {
  constructor(message: string) {
    super(message);
    this.name = "TenantInvariantViolation";
  }
}
