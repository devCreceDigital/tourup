export class PlatformTenantViewDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlatformTenantViewDomainError";
  }
}

export class PlatformTenantViewInvariantViolation extends PlatformTenantViewDomainError {
  constructor(message: string) {
    super(message);
    this.name = "PlatformTenantViewInvariantViolation";
  }
}
