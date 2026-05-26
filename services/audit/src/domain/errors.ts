export class AuditEventDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditEventDomainError";
  }
}

export class AuditEventInvariantViolation extends AuditEventDomainError {
  constructor(message: string) {
    super(message);
    this.name = "AuditEventInvariantViolation";
  }
}
