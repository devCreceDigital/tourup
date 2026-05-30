import type { ExtractedProgram } from "@/lib/onboarding/parseDocument";

export async function createTripsBulk(programs: ExtractedProgram[]) {
  const res = await fetch("/api/onboarding/create-trips-bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ programs }),
  });
  if (!res.ok) throw new Error("Error al crear los viajes");
  return res.json() as Promise<{ success: boolean; tripIds: string[]; count: number }>;
}
