export class CatalogItemDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogItemDomainError";
  }
}

export class CatalogItemInvariantViolation extends CatalogItemDomainError {
  constructor(message: string) {
    super(message);
    this.name = "CatalogItemInvariantViolation";
  }
}
