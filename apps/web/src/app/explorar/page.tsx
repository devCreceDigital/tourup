"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchAssistant } from "@/shared/api/assistant-api-client"

interface Trip {
  share_token: string
  title: string
  destination: string
  days: number
  travelers: number | null
  budget_total: number | null
  weather_temp: string | null
  created_at: string
}

const DEST_EMOJIS: Record<string, string> = {
  cusco: "🏔️", lima: "🌆", arequipa: "🌋", machu: "🏛️",
  paracas: "🦩", tarapoto: "🌿", iquitos: "🐊", huaraz: "⛰️",
}

function destEmoji(dest: string) {
  const d = dest.toLowerCase()
  for (const [key, emoji] of Object.entries(DEST_EMOJIS)) {
    if (d.includes(key)) return emoji
  }
  return "✈️"
}

function TripCard({ trip, onClone }: { trip: Trip; onClone: (token: string) => void }) {
  const shortTitle = trip.title.length > 40 ? trip.title.slice(0, 40) + "..." : trip.title
  const shortDest = trip.destination.length > 30 ? trip.destination.slice(0, 30) + "..." : trip.destination

  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
      overflow: "hidden", display: "flex", flexDirection: "column",
      transition: "box-shadow 0.2s",
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)")}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Card header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: "20px 20px 16px", color: "#fff",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>{destEmoji(trip.destination)}</div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>{shortTitle}</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>📍 {shortDest}</div>
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 20px", flex: 1 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
            📅 {trip.days} días
          </span>
          {trip.travelers && (
            <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
              👥 {trip.travelers} personas
            </span>
          )}
          {trip.weather_temp && (
            <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
              🌤️ {trip.weather_temp}
            </span>
          )}
        </div>
        {trip.budget_total && (
          <div style={{
            background: "#f0fdf4", borderRadius: 8, padding: "8px 12px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, color: "#15803d" }}>Presupuesto estimado</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#15803d" }}>
              S/. {trip.budget_total.toLocaleString("es-PE")}
            </span>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 8 }}>
        
        <a
          href={`/trip?token=${trip.share_token}`}
          style={{
            flex: 1, textAlign: "center", padding: "8px 0", fontSize: 13,
            color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8,
            textDecoration: "none", fontWeight: 500,
          }}
        >
          Ver viaje
        </a>
        <button
          onClick={() => onClone(trip.share_token)}
          style={{
            flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 500,
            background: "#1D9E75", color: "#fff", border: "none",
            borderRadius: 8, cursor: "pointer",
          }}
        >
          ✨ Clonar y editar
        </button>
      </div>
    </div>
  )
}

export default function ExplorarPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchAssistant("/trips-list/")
      .then(r => r.json())
      .then(data => { setTrips(data.trips || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = trips.filter(t =>
    t.destination.toLowerCase().includes(search.toLowerCase()) ||
    t.title.toLowerCase().includes(search.toLowerCase())
  ).filter(t => t.title.length < 60 && t.destination.length < 40)

  const handleClone = (token: string) => {
    router.push(`/asistente-ia?clone=${token}`)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 22 }}>🌎</span>
              <span style={{ fontWeight: 700, fontSize: 20, color: "#1a1a2e" }}>Explorar viajes</span>
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Descubre itinerarios creados por otros viajeros · {trips.length} viajes disponibles
            </div>
          </div>
          
          <a
            href="/asistente-ia"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#1D9E75", color: "#fff", borderRadius: 8,
              padding: "10px 18px", fontSize: 13, fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ✨ Planear mi viaje
          </a>
        </div>
      </div>

      {/* Search */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 8px" }}>
        <input
          type="text"
          placeholder="🔍 Buscar por destino..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 360, padding: "10px 14px", fontSize: 14,
            border: "1px solid #e5e7eb", borderRadius: 8, outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✈️</div>
            <div>Cargando viajes...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
            <div>No hay viajes que coincidan.</div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {filtered.map(trip => (
              <TripCard key={trip.share_token} trip={trip} onClone={handleClone} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "32px 16px", fontSize: 13, color: "#9ca3af" }}>
        <strong style={{ color: "#1D9E75" }}>ToTem HUB AI</strong> ·{" "}
        <a href="/asistente-ia" style={{ color: "#1D9E75" }}>Planear mi viaje</a>
      </div>
    </div>
  )
}
