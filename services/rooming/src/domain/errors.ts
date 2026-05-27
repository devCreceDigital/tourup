export class RoomingPlanInvariantViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoomingPlanInvariantViolation";
  }
}
