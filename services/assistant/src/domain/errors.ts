export class AssistantSessionDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantSessionDomainError";
  }
}

export class AssistantSessionInvariantViolation extends AssistantSessionDomainError {
  constructor(message: string) {
    super(message);
    this.name = "AssistantSessionInvariantViolation";
  }
}
