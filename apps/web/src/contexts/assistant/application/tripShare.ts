import type { BudgetResult, ItineraryDay, WeatherResult } from "@/shared/domain/totem-types";
import { assistantUrl, fetchAssistant } from "@/shared/api/assistant-api-client";

export type AssistantTripSnapshot = {
  itinerary?: ItineraryDay[];
  budget?: BudgetResult | null;
  weather?: WeatherResult | null;
  share_token?: string;
};

export type CreateAssistantTripShareRequest = {
  sessionToken: string | null;
  title: string;
  destination: string;
  days: number;
  itinerary: ItineraryDay[];
  budget: BudgetResult | null;
  weather: WeatherResult | null;
};

export type CreateAssistantTripShareResponse = {
  shareToken: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isItineraryDay = (value: unknown): value is ItineraryDay =>
  isRecord(value)
  && typeof value.dia === "number"
  && typeof value.actividad === "string"
  && typeof value.destino === "string";

const isBudgetResult = (value: unknown): value is BudgetResult =>
  isRecord(value)
  && typeof value.travelers === "number"
  && typeof value.days === "number"
  && typeof value.category === "string"
  && isRecord(value.breakdown)
  && typeof value.breakdown.hospedaje === "number"
  && typeof value.breakdown.alimentacion === "number"
  && typeof value.breakdown.transporte === "number"
  && typeof value.breakdown.extras === "number"
  && typeof value.total_soles === "number"
  && typeof value.per_person === "number";

const isWeatherResult = (value: unknown): value is WeatherResult =>
  isRecord(value)
  && typeof value.temperature === "string"
  && typeof value.condition === "string"
  && typeof value.best_time === "string";

export async function fetchAssistantTripByToken(token: string): Promise<AssistantTripSnapshot | null> {
  const response = await fetchAssistant(`/trips/${token}/`);
  if (!response.ok) return null;
  const data: unknown = await response.json();
  if (!isRecord(data) || !Array.isArray(data.itinerary)) return null;
  const itinerary = data.itinerary.filter(isItineraryDay);
  if (itinerary.length === 0) return null;
  const snapshot: AssistantTripSnapshot = {
    itinerary,
    budget: isBudgetResult(data.budget) ? data.budget : null,
    weather: isWeatherResult(data.weather) ? data.weather : null,
  };
  if (typeof data.share_token === "string") snapshot.share_token = data.share_token;
  return snapshot;
}

export async function createAssistantTripShare(request: CreateAssistantTripShareRequest): Promise<CreateAssistantTripShareResponse> {
  const response = await fetchAssistant("/trips/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_token: request.sessionToken,
      title: request.title,
      destination: request.destination,
      days: request.days,
      itinerary: request.itinerary,
      budget: request.budget,
      weather: request.weather,
    }),
  });
  if (!response.ok) {
    throw new Error(`No se pudo guardar el viaje compartido. HTTP ${response.status}`);
  }
  const data: unknown = await response.json();
  if (!isRecord(data) || typeof data.share_token !== "string") {
    throw new Error("La API no devolvió un token de viaje compartido válido.");
  }
  return { shareToken: data.share_token };
}

export async function downloadAssistantTripPdf(shareToken: string): Promise<Blob> {
  const response = await fetch(assistantUrl(`/trips/${shareToken}/pdf/`));
  if (!response.ok) {
    throw new Error("Error generando PDF");
  }
  return response.blob();
}
