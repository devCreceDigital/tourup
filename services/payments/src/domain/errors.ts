export class PaymentDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentDomainError";
  }
}

export class PaymentInvariantViolation extends PaymentDomainError {
  constructor(message: string) {
    super(message);
    this.name = "PaymentInvariantViolation";
  }
}
