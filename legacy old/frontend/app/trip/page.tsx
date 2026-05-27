"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ItineraryCard from "@/components/asistente-ia/tool-cards/ItineraryCard"
import BudgetCard from "@/components/asistente-ia/tool-cards/BudgetCard"
import WeatherCard from "@/components/asistente-ia/tool-cards/WeatherCard"
import type { BudgetResult, ItineraryDay, WeatherResult } from "@/types"
import { getApiBaseUrl } from "@/lib/env"

function PdfDownloadButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const apiBase = getApiBaseUrl()

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/asistente-ia/trips/${token}/pdf/`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `viaje-totem-${token.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("PDF error:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 8, padding: "8px 14px", fontSize: 13,
        fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", color: "#374151",
      }}
    >
      {loading ? "Generando..." : "⬇️ Descargar PDF"}
    </button>
  )
}

function TripContent() {
  type TripWeather = WeatherResult | { result?: WeatherResult }
  type TripPlan = {
    itinerary?: ItineraryDay[]
    budget?: BudgetResult | null
    weather?: TripWeather | null
    title?: string
    destination?: string
    days?: number
    travelers?: number
    error?: unknown
  }

  const [trip, setTrip] = useState<TripPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"itinerario" | "presupuesto">("itinerario")
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    const apiBase = getApiBaseUrl()
    if (!token) {
      if (typeof queueMicrotask === "function") queueMicrotask(() => setLoading(false))
      else void Promise.resolve().then(() => setLoading(false))
      return
    }
    fetch(`${apiBase}/asistente-ia/trips/${token}/`)
      .then((r) => r.json())
      .then((data: unknown) => {
        setTrip(data as TripPlan)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✈️</div>
        <div>Cargando viaje...</div>
      </div>
    </div>
  )

  if (!trip || trip.error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
        <div>Viaje no encontrado.</div>
        <a href="/asistente-ia" style={{ color: "#1D9E75", fontSize: 13, marginTop: 8, display: "block" }}>
          Planear un nuevo viaje →
        </a>
      </div>
    </div>
  )

  const itineraryDays = trip.itinerary ?? []
  const budgetResult = trip.budget
  const weatherResult = trip.weather
  const normalizedWeather: WeatherResult | null = weatherResult
    ? ("result" in weatherResult
        ? (weatherResult as { result?: WeatherResult }).result ?? null
        : (weatherResult as WeatherResult))
    : null

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px", fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? "#1D9E75" : "#6b7280",
    borderBottom: `2px solid ${active ? "#1D9E75" : "transparent"}`,
    cursor: "pointer", background: "none", border: "none",
    outline: "none",
  })

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>🌿</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: "#1a1a2e" }}>
                  {trip.title || `Viaje a ${trip.destination}`}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                📍 {trip.destination} · 📅 {trip.days} días
                {trip.travelers ? ` · 👥 ${trip.travelers} personas` : ""}
                {normalizedWeather ? ` · 🌤️ ${normalizedWeather.temperature}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {token && <PdfDownloadButton token={token} />}
              
              <a
                href="/asistente-ia"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#1D9E75", color: "#fff", borderRadius: 8,
                  padding: "8px 14px", fontSize: 13, fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                ✨ Planear mi viaje
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex" }}>
          <button style={tabStyle(activeTab === "itinerario")} onClick={() => setActiveTab("itinerario")}>
            🗓 Itinerario
          </button>
          {budgetResult && (
            <button style={tabStyle(activeTab === "presupuesto")} onClick={() => setActiveTab("presupuesto")}>
              💰 Presupuesto
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
        {activeTab === "itinerario" && (
          itineraryDays.length > 0
            ? <ItineraryCard days={itineraryDays} />
            : <div style={{ textAlign: "center", color: "#9ca3af", padding: "48px 0" }}>Sin itinerario disponible.</div>
        )}
        {activeTab === "presupuesto" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {budgetResult && <BudgetCard budget={budgetResult} />}
            {normalizedWeather && <WeatherCard weather={normalizedWeather} />}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "32px 16px", fontSize: 13, color: "#9ca3af" }}>
        Creado con <strong style={{ color: "#1D9E75" }}>ToTem HUB AI</strong> ·{" "}
        <a href="/asistente-ia" style={{ color: "#1D9E75" }}>Planea tu propio viaje</a>
      </div>
    </div>
  )
}

export default function TripPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>Cargando...</div>
      </div>
    }>
      <TripContent />
    </Suspense>
  )
}
