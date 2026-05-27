"use client"
import { useEffect, useState } from "react"

interface Stats {
  totals: { sessions: number; trips: number; leads: number }
  recent: { sessions_7d: number; sessions_30d: number; trips_7d: number }
  top_destinations: { destination: string; n: number }[]
  recent_trips: {
    title: string; destination: string; days: number
    travelers: number | null; budget_total: number | null
    share_token: string; created_at: string
  }[]
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

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
      padding: "20px 24px", flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value.toLocaleString()}</div>
      {sub && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const apiBase = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api"

  useEffect(() => {
    fetch(`${apiBase}/asistente-ia/stats/`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
        <div>Cargando estadísticas...</div>
      </div>
    </div>
  )

  if (!stats) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6b7280" }}>Error cargando stats.</div>
    </div>
  )

  const maxN = Math.max(...stats.top_destinations.map(d => d.n), 1)

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 22 }}>📊</span>
              <span style={{ fontWeight: 700, fontSize: 20, color: "#1a1a2e" }}>Dashboard ToTem AI</span>
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Métricas del asistente de viajes</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/explorar" style={{ padding: "8px 14px", fontSize: 13, color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, textDecoration: "none" }}>
              🌎 Explorar viajes
            </a>
            <a href="/asistente-ia" style={{ padding: "8px 14px", fontSize: 13, background: "#1D9E75", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
              ✨ Planear viaje
            </a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        {/* KPI Cards */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <StatCard label="Sesiones totales" value={stats.totals.sessions} sub={`${stats.recent.sessions_7d} esta semana`} color="#1D9E75" />
          <StatCard label="Itinerarios generados" value={stats.totals.trips} sub={`${stats.recent.trips_7d} esta semana`} color="#3b82f6" />
          <StatCard label="Leads capturados" value={stats.totals.leads} sub="registros de interés" color="#f59e0b" />
          <StatCard label="Sesiones (30 días)" value={stats.recent.sessions_30d} sub="último mes" color="#8b5cf6" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {/* Top destinos */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px" }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: "#1a1a2e" }}>🏆 Top destinos</div>
            {stats.top_destinations.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Sin datos aún</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {stats.top_destinations.map((d, i) => (
                  <div key={d.destination}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                      <span>{destEmoji(d.destination)} {d.destination}</span>
                      <span style={{ fontWeight: 600, color: "#1D9E75" }}>{d.n} viajes</span>
                    </div>
                    <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        background: i === 0 ? "#1D9E75" : i === 1 ? "#3b82f6" : "#94a3b8",
                        width: `${(d.n / maxN) * 100}%`,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actividad reciente */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px" }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: "#1a1a2e" }}>⚡ Actividad reciente</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Sesiones hoy", value: Math.round(stats.recent.sessions_7d / 7), color: "#1D9E75" },
                { label: "Sesiones esta semana", value: stats.recent.sessions_7d, color: "#3b82f6" },
                { label: "Sesiones este mes", value: stats.recent.sessions_30d, color: "#8b5cf6" },
                { label: "Trips esta semana", value: stats.recent.trips_7d, color: "#f59e0b" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>{item.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trips recientes */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px" }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: "#1a1a2e" }}>🗺️ Últimos itinerarios generados</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {stats.recent_trips.map((t, i) => (
              <div key={t.share_token} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 0", borderBottom: i < stats.recent_trips.length - 1 ? "1px solid #f3f4f6" : "none",
                flexWrap: "wrap", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{destEmoji(t.destination)}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{t.title.slice(0, 35)}{t.title.length > 35 ? "..." : ""}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {t.days} días · {t.travelers ? `${t.travelers} personas` : "grupo"}
                      {t.budget_total ? ` · S/. ${t.budget_total.toLocaleString("es-PE")}` : ""}
                    </div>
                  </div>
                </div>
                <a href={`/trip?token=${t.share_token}`} style={{
                  fontSize: 12, color: "#1D9E75", border: "1px solid #1D9E75",
                  borderRadius: 6, padding: "4px 10px", textDecoration: "none", fontWeight: 500,
                }}>
                  Ver →
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "24px 16px", fontSize: 13, color: "#9ca3af" }}>
        <strong style={{ color: "#1D9E75" }}>ToTem HUB AI</strong> · Dashboard interno
      </div>
    </div>
  )
}
