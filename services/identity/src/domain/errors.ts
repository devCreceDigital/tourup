export class ProfileDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileDomainError";
  }
}

export class ProfileInvariantViolation extends ProfileDomainError {
  constructor(message: string) {
    super(message);
    this.name = "ProfileInvariantViolation";
  }
}
