import type { TripData } from "@/lib/onboarding/validateTrip";

export async function createTrip(data: TripData) {
  const res = await fetch("/api/onboarding/create-trip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al publicar el viaje");
  return res.json() as Promise<{ success: boolean; tripId: string }>;
}
