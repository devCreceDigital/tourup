export interface GeoPoint {
  lat: number
  lng: number
  label: string
}

const PERU_COORDS: Record<string, { lat: number; lng: number }> = {
  peru: { lat: -9.19, lng: -75.015 },
  lima: { lat: -12.0464, lng: -77.0428 },
  cusco: { lat: -13.532, lng: -71.9675 },
  "machu picchu": { lat: -13.1631, lng: -72.545 },
  "macchu picchu": { lat: -13.1631, lng: -72.545 },
  arequipa: { lat: -16.409, lng: -71.5375 },
  paracas: { lat: -13.8495, lng: -76.2503 },
  ica: { lat: -14.0678, lng: -75.7286 },
  huacachina: { lat: -14.0873, lng: -75.7624 },
  trujillo: { lat: -8.1116, lng: -79.0288 },
  puno: { lat: -15.8402, lng: -70.0219 },
  "lago titicaca": { lat: -15.9254, lng: -69.3354 },
  titicaca: { lat: -15.9254, lng: -69.3354 },
  "valle sagrado": { lat: -13.3186, lng: -72.1003 },
  "aguas calientes": { lat: -13.1536, lng: -72.5282 },
  ollantaytambo: { lat: -13.2588, lng: -72.2625 },
  pisac: { lat: -13.4154, lng: -71.8499 },
  chachapoyas: { lat: -6.2318, lng: -77.8701 },
  huaraz: { lat: -9.5275, lng: -77.5279 },
  iquitos: { lat: -3.7437, lng: -73.2516 },
  "puerto maldonado": { lat: -12.5933, lng: -69.1893 },
  nazca: { lat: -14.8295, lng: -74.9304 },
  nasca: { lat: -14.8295, lng: -74.9304 },
  mancora: { lat: -4.1058, lng: -81.0445 },
  piura: { lat: -5.1945, lng: -80.6328 },
  chiclayo: { lat: -6.7714, lng: -79.8409 },
  tacna: { lat: -18.0066, lng: -70.2482 },
  moquegua: { lat: -17.1922, lng: -70.9328 },
  ayacucho: { lat: -13.1588, lng: -74.2236 },
  huancayo: { lat: -12.0651, lng: -75.2049 },
  "lago junin": { lat: -11.03, lng: -76.12 },
  moyobamba: { lat: -6.034, lng: -76.972 },
  tarapoto: { lat: -6.4851, lng: -76.3614 },
  "maras moray": { lat: -13.3333, lng: -72.15 },
  chinchero: { lat: -13.3929, lng: -72.0444 },
  "islas ballestas": { lat: -13.7756, lng: -76.4085 },
  ballestas: { lat: -13.7756, lng: -76.4085 },
  "reserva nacional de paracas": { lat: -13.9, lng: -76.3 },
}

export function resolveDestinations(text: string): GeoPoint[] {
  if (!text) return []
  const parts = text.split(/[-–—,&]/).map((s) => s.trim()).filter(Boolean)
  const seen = new Set<string>()
  const result: GeoPoint[] = []

  for (const part of parts) {
    const key = part.toLowerCase()
    const coords = PERU_COORDS[key]
    if (coords && !seen.has(key)) {
      seen.add(key)
      result.push({ ...coords, label: part })
    }
  }

  return result
}

export function centerOfMarkers(markers: GeoPoint[]): { lat: number; lng: number } {
  if (!markers.length) return { lat: -9.19, lng: -75.015 }
  const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length
  const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length
  return { lat, lng }
}

export function zoomForMarkers(count: number): number {
  if (count === 0) return 5
  if (count === 1) return 11
  if (count <= 3) return 7
  return 6
}
