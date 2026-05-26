export class SupportTicketDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupportTicketDomainError";
  }
}

export class SupportTicketInvariantViolation extends SupportTicketDomainError {
  constructor(message: string) {
    super(message);
    this.name = "SupportTicketInvariantViolation";
  }
}
