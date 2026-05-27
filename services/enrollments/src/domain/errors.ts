export class EnrollmentDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnrollmentDomainError";
  }
}

export class EnrollmentInvariantViolation extends EnrollmentDomainError {
  constructor(message: string) {
    super(message);
    this.name = "EnrollmentInvariantViolation";
  }
}
