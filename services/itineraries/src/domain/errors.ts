export class ItineraryDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ItineraryDomainError";
  }
}

export class ItineraryInvariantViolation extends ItineraryDomainError {
  constructor(message: string) {
    super(message);
    this.name = "ItineraryInvariantViolation";
  }
}
