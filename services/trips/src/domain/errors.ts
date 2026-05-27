export class TripDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TripDomainError";
  }
}

export class TripInvariantViolation extends TripDomainError {
  constructor(message: string) {
    super(message);
    this.name = "TripInvariantViolation";
  }
}
