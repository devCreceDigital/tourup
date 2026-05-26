import type { EntityId, TenantId } from "@totem/shared-kernel";

export type ItineraryStatus = "borrador" | "activo" | "archivado";

export type ItineraryEvent = {
  readonly id: EntityId;
  readonly type: "traslado" | "actividad" | "comida" | "alojamiento" | "libre" | "otro";
  readonly description: string;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly order: number;
  readonly activityId: EntityId | null;
};

export type ItineraryDay = {
  readonly id: EntityId;
  readonly dayNumber: number;
  readonly title: string;
  readonly summary: string;
  readonly overnightAccommodation: string | null;
  readonly destinationName: string | null;
  readonly events: readonly ItineraryEvent[];
};

export type Itinerary = {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly description: string;
  readonly version: number;
  readonly status: ItineraryStatus;
  readonly days: readonly ItineraryDay[];
};

export function assertValidItinerary(itinerary: Itinerary): void {
  const dayNumbers = new Set<number>();
  for (const day of itinerary.days) {
    if (day.dayNumber < 1) {
      throw new Error("Itinerary day number must be positive.");
    }
    if (dayNumbers.has(day.dayNumber)) {
      throw new Error("Itinerary day numbers must be unique.");
    }
    dayNumbers.add(day.dayNumber);
  }
}
