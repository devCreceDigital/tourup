import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertPublishableTrip, type TripDetails } from "../domain/trip.js";

export interface TripCatalogRepository {
  findBySlug(tenantId: TenantId, slug: string): Promise<TripDetails | null>;
  findById(tenantId: TenantId, tripId: EntityId): Promise<TripDetails | null>;
  countByTenant?(tenantId: TenantId): Promise<number>;
  save(trip: TripDetails, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export type CreateTripInput = Omit<TripDetails, "tenantId" | "lifecycle"> & {
  readonly idempotencyKey: IdempotencyKey;
};

export class CreateTrip {
  constructor(private readonly trips: TripCatalogRepository) {}

  async execute(input: CreateTripInput, context: TenantContext): Promise<TripDetails> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const existing = await this.trips.findBySlug(tenantId, input.publicIdentity.slug);
    if (existing !== null) {
      throw new Error("Trip slug already exists for this tenant.");
    }
    const trip: TripDetails = { ...input, tenantId, lifecycle: "borrador" };
    await this.trips.save(trip, input.idempotencyKey);
    return trip;
  }
}

export class PublishTrip {
  constructor(private readonly trips: TripCatalogRepository) {}

  async execute(tripId: EntityId, context: TenantContext): Promise<TripDetails> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const trip = await this.trips.findById(tenantId, tripId);
    if (trip === null) {
      throw new Error("Trip not found.");
    }
    assertPublishableTrip(trip);
    const published: TripDetails = { ...trip, lifecycle: "publicado" };
    await this.trips.save(published);
    return published;
  }
}
