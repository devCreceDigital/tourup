export interface TripData {
  title: string;
  description: string;
  type: string;
  destinationMain: string;
  durationDays: number;
  startDate: string;
  travelerTypes: string[];
  maxCapacity: number;
  priceFrom: number;
  priceTo: number;
  currency: string;
  activities: string[];
  includes: string[];
  difficultyLevel: string;
  specialNotes: string;
}

export const EMPTY_TRIP: TripData = {
  title: "", description: "", type: "", destinationMain: "",
  durationDays: 0, startDate: "", travelerTypes: [], maxCapacity: 0,
  priceFrom: 0, priceTo: 0, currency: "USD", activities: [],
  includes: [], difficultyLevel: "", specialNotes: "",
};

export type TripErrors = Partial<Record<keyof TripData, string>>;

export function validateTripData(data: TripData): TripErrors {
  const e: TripErrors = {};
  if (data.title.trim().length < 10) e.title = "El título debe tener al menos 10 caracteres";
  if (data.description.trim().length < 30) e.description = "Proporciona una descripción más detallada (mín. 30 caracteres)";
  if (!data.type) e.type = "Selecciona un tipo de viaje";
  if (!data.destinationMain.trim()) e.destinationMain = "Especifica el destino principal";
  if (!data.durationDays || data.durationDays < 1 || data.durationDays > 365) e.durationDays = "La duración debe estar entre 1 y 365 días";
  if (data.travelerTypes.length === 0) e.travelerTypes = "Selecciona al menos un tipo de viajero";
  if (!data.maxCapacity || data.maxCapacity < 1) e.maxCapacity = "Capacidad mínima es 1 viajero";
  if (!data.priceFrom || data.priceFrom <= 0) e.priceFrom = "El precio debe ser mayor a 0";
  if (data.activities.length === 0) e.activities = "Agrega al menos una actividad";
  return e;
}
