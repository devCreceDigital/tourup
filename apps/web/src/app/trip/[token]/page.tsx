import { notFound } from "next/navigation"
import { getAssistantApiBaseUrl } from "@/shared/config/env"

interface TripDay {
  dia: number
  actividad: string
  destino: string
}

async function getTrip(token: string) {
  const base = getAssistantApiBaseUrl()
  const res = await fetch(`${base}/trips/${token}/`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

export default async function TripPage({ params }: { params: { token: string } }) {
  const trip = await getTrip(params.token)
  if (!trip) notFound()

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{trip.title}</h1>
      <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
        {trip.destination} · {trip.days} días · {trip.travelers} personas
      </p>

      {trip.budget && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Presupuesto estimado</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#15803d" }}>
            S/. {trip.budget.total_soles?.toLocaleString("es-PE")}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>
            S/. {trip.budget.per_person} por persona · categoría {trip.budget.category}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(trip.itinerary as TripDay[]).map((day) => (
          <div key={day.dia} style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: "#f9fafb", padding: "8px 14px", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #e5e7eb" }}>
              Día {day.dia} · {day.destino}
            </div>
            <div style={{ padding: "10px 14px", fontSize: 14 }}>{day.actividad}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: "12px 16px", background: "#f9fafb", borderRadius: 10, fontSize: 13, color: "#888", textAlign: "center" }}>
        Creado con <strong>Viaja Perú AI</strong> · <a href="/asistente-ia" style={{ color: "#1D9E75" }}>Planea tu propio viaje</a>
      </div>
    </main>
  )
}
