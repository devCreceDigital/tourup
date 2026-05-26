import type { EntityId, Money, TenantId } from "@totem/shared-kernel";

export type TripLifecycle = "borrador" | "publicado" | "archivado" | "cancelado";

export type TripDateRange = {
  readonly startDate: string;
  readonly endDate: string;
};

export type TripCapacity = {
  readonly maxSeats: number | null;
};

export type TripPublicIdentity = {
  readonly code: string;
  readonly slug: string;
  readonly name: string;
};

export type TripCommercialConfiguration = {
  readonly basePrice: Money | null;
  readonly currency: "PEN" | "USD";
  readonly settings: Record<string, unknown>;
};

export type TripDetails = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly itineraryId: EntityId | null;
  readonly publicIdentity: TripPublicIdentity;
  readonly lifecycle: TripLifecycle;
  readonly dates: TripDateRange;
  readonly capacity: TripCapacity;
  readonly commercial: TripCommercialConfiguration;
};

export function assertValidTripDates(dates: TripDateRange): void {
  if (dates.endDate < dates.startDate) {
    throw new Error("Trip end date cannot be earlier than start date.");
  }
}

export function assertValidTripCapacity(capacity: TripCapacity): void {
  if (capacity.maxSeats !== null && capacity.maxSeats < 1) {
    throw new Error("Trip capacity must be positive.");
  }
}

export function assertPublishableTrip(trip: TripDetails): void {
  assertValidTripDates(trip.dates);
  assertValidTripCapacity(trip.capacity);
  if (trip.publicIdentity.slug.trim().length === 0) {
    throw new Error("Published trip requires a slug.");
  }
  if (trip.publicIdentity.name.trim().length === 0) {
    throw new Error("Published trip requires a name.");
  }
}
