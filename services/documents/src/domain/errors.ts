export class TravelerDocumentDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TravelerDocumentDomainError";
  }
}

export class TravelerDocumentInvariantViolation extends TravelerDocumentDomainError {
  constructor(message: string) {
    super(message);
    this.name = "TravelerDocumentInvariantViolation";
  }
}
