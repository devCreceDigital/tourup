export class NotificationDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationDomainError";
  }
}

export class NotificationInvariantViolation extends NotificationDomainError {
  constructor(message: string) {
    super(message);
    this.name = "NotificationInvariantViolation";
  }
}
