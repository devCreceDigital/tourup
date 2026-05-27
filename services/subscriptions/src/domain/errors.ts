export class SubscriptionDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionDomainError";
  }
}

export class SubscriptionInvariantViolation extends SubscriptionDomainError {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionInvariantViolation";
  }
}
