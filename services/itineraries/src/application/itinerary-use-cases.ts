import type { EntityId, IdempotencyKey, TenantContext, TenantId } from "@totem/shared-kernel";
import { assertAdmin, requireTenant } from "@totem/shared-kernel";
import { assertValidItinerary, type Itinerary } from "../domain/itinerary.js";

export interface ItineraryRepository {
  findById(tenantId: TenantId, id: EntityId): Promise<Itinerary | null>;
  save(itinerary: Itinerary, idempotencyKey?: IdempotencyKey): Promise<void>;
}

export class SaveItinerary {
  constructor(private readonly itineraries: ItineraryRepository) {}

  async execute(itinerary: Itinerary, idempotencyKey: IdempotencyKey, context: TenantContext): Promise<Itinerary> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const owned: Itinerary = { ...itinerary, tenantId };
    assertValidItinerary(owned);
    await this.itineraries.save(owned, idempotencyKey);
    return owned;
  }
}

export class CloneItinerary {
  constructor(private readonly itineraries: ItineraryRepository, private readonly newId: () => EntityId) {}

  async execute(sourceId: EntityId, context: TenantContext): Promise<Itinerary> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const source = await this.itineraries.findById(tenantId, sourceId);
    if (source === null) {
      throw new Error("Itinerary not found.");
    }
    const clone: Itinerary = {
      ...source,
      id: this.newId(),
      name: `${source.name} (copia)`,
      version: source.version + 1,
      status: "borrador"
    };
    await this.itineraries.save(clone);
    return clone;
  }
}

export class PublishItinerary {
  constructor(private readonly itineraries: ItineraryRepository) {}

  async execute(itineraryId: EntityId, context: TenantContext): Promise<Itinerary> {
    assertAdmin(context);
    const tenantId = requireTenant(context);
    const itinerary = await this.itineraries.findById(tenantId, itineraryId);
    if (itinerary === null) {
      throw new Error("Itinerary not found.");
    }
    const published: Itinerary = { ...itinerary, status: "activo", version: itinerary.version + 1 };
    assertValidItinerary(published);
    await this.itineraries.save(published);
    return published;
  }
}
