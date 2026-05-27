export type GeocodedPlace = {
  lat: number;
  lon: number;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
};

const isNominatimResult = (value: unknown): value is NominatimResult =>
  typeof value === "object" && value !== null;

export async function geocodePlace(query: string): Promise<GeocodedPlace | null> {
  if (!query || query === "—") return null;
  const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
  if (!response.ok) return null;
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return null;
  const first = data[0];
  if (!isNominatimResult(first) || first.lat === undefined || first.lon === undefined) return null;
  const lat = Number.parseFloat(first.lat);
  const lon = Number.parseFloat(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}
