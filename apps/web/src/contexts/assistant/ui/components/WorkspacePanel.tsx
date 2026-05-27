"use client"

import { useEffect, useState } from "react"
import type { BudgetResult, ChatMessage, ItineraryDay, MatchResult, WeatherResult } from "@/shared/domain/totem-types"
import { CalendarDays, Flag, Layers, Map, Plus, Wallet } from "lucide-react"
import TripMap from "@/shared/ui/maps/TripMap"
import { resolveDestinations, type GeoPoint } from "@/shared/data/geoHelper"
import { createAssistantTripShare, downloadAssistantTripPdf, type AssistantTripSnapshot } from "@/contexts/assistant/application/tripShare"
import ItineraryCard from "./tool-cards/ItineraryCard"
import BudgetCard    from "./tool-cards/BudgetCard"
import WeatherCard   from "./tool-cards/WeatherCard"
import {
  ItinerarySkeleton,
  BudgetSkeleton,
  WeatherSkeleton,
} from "./WorkspaceSkeleton"
import styles from "./asistente-ia.module.css"

type WorkspaceTab = "itinerario" | "presupuesto" | "mapa"

const deferStateUpdate = (fn: () => void) => {
  if (typeof queueMicrotask === "function") queueMicrotask(fn)
  else void Promise.resolve().then(fn)
}

interface WorkspacePanelProps {
  messages: ChatMessage[]
  selectedMatch: MatchResult | null
  onCreateTrip?: () => void
  sessionToken?: string | null
  preloadedTrip?: AssistantTripSnapshot | null
}

export default function WorkspacePanel({
  messages,
  selectedMatch,
  onCreateTrip,
  sessionToken,
  preloadedTrip,
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("mapa")
  const [satellite, setSatellite] = useState(false)
  const [autoShareUrl, setAutoShareUrl] = useState<string | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)

  // ── Streaming state — derived from the last assistant message ──
  const lastMsg = [...messages].reverse().find((m) => m.role === "assistant")
  const isStreaming    = lastMsg?.isStreaming ?? false
  const pipelineSteps = lastMsg?.pipelineSteps ?? []

  // Which tools were started (type:"tool" in pipelineSteps)
  const toolStepIds = pipelineSteps
    .filter((s) => s.type === "tool")
    .map((s) => s.id)

  const willGenerateItinerary = toolStepIds.includes("generate_itinerary")
  const willCalculateBudget   = toolStepIds.includes("calculate_budget")
  const willGetWeather        = toolStepIds.includes("get_weather")

  // ── Tool results — last message that has them ──────────────────
  const lastWithTools = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.toolResults?.length)
  const toolResults = lastWithTools?.toolResults ?? []

  const itineraryDays = toolResults
    .filter((r) => r.tool_name === "generate_itinerary")
    .flatMap((r) => {
      const res = r.result
      // Nuevo formato: lista directa de días con slots
      if (Array.isArray(res)) return res as ItineraryDay[]
      // Formato objeto: { itinerary: [...] }
      if (res && typeof res === "object") {
        const itinerary = (res as { itinerary?: unknown }).itinerary
        if (Array.isArray(itinerary)) return itinerary as ItineraryDay[]
      }
      return []
    })

  const budgetResult  = toolResults.find((r) => r.tool_name === "calculate_budget")
    ?.result as BudgetResult | undefined
  const weatherResult = toolResults.find((r) => r.tool_name === "get_weather")
    ?.result as WeatherResult | undefined

  // Merge con preloadedTrip si no hay tool results propios
  const finalItineraryDays = itineraryDays.length > 0
    ? itineraryDays
    : preloadedTrip?.itinerary ?? []
  const finalBudgetResult = budgetResult ?? preloadedTrip?.budget ?? undefined
  const finalWeatherResult = weatherResult ?? preloadedTrip?.weather ?? null

  const hasItinerary = finalItineraryDays.length > 0
  const hasBudget    = !!budgetResult

  // ── Map markers ────────────────────────────────────────────────
  // Prioridad 1: markers reales de buscar_lugares / buscar_hoteles (map_update)
  type MapUpdateMarker = { lat: number; lng: number; label: string; type?: string }

  const isMapUpdateMarker = (value: unknown): value is MapUpdateMarker => {
    if (!value || typeof value !== "object") return false
    const v = value as { lat?: unknown; lng?: unknown; label?: unknown; type?: unknown }
    return typeof v.lat === "number" && typeof v.lng === "number" && typeof v.label === "string"
  }

  const extractMapUpdateMarkers = (result: unknown): MapUpdateMarker[] => {
    if (!result || typeof result !== "object") return []
    const mapUpdate = (result as { map_update?: unknown }).map_update
    if (!mapUpdate || typeof mapUpdate !== "object") return []
    const markers = (mapUpdate as { markers?: unknown }).markers
    if (!Array.isArray(markers)) return []
    return markers.filter(isMapUpdateMarker)
  }

  const mapUpdateMarkers: GeoPoint[] = toolResults
    .flatMap((r) => extractMapUpdateMarkers(r.result))
    .map((m) => ({ lat: m.lat, lng: m.lng, label: m.label }))

  // Prioridad 2: fallback por texto del chat
  const recentText = messages.slice(-6).map((m) => m.content).join(" ")
  const textMarkers = resolveDestinations(recentText)

  const markers = mapUpdateMarkers.length > 0 ? mapUpdateMarkers : textMarkers
  const destination = markers.map((m) => m.label).join(" – ") || "Perú"
  const shareTokenFromAutoUrl = autoShareUrl?.split("token=")[1] ?? null

  // ── Auto-switch tab ────────────────────────────────────────────
  // Switches eagerly on tool_start (skeleton phase) AND on result arrival.
  const preloadedItineraryLen = preloadedTrip?.itinerary?.length ?? 0
  useEffect(() => {
    let nextTab: WorkspaceTab | null = null
    if (preloadedItineraryLen) nextTab = "itinerario"
    else if (hasItinerary || willGenerateItinerary) nextTab = "itinerario"
    else if (hasBudget || willCalculateBudget) nextTab = "presupuesto"

    if (nextTab) deferStateUpdate(() => setActiveTab(nextTab))
  }, [preloadedItineraryLen, hasItinerary, hasBudget, willGenerateItinerary, willCalculateBudget])

  // ── Auto-save trip cuando llega itinerario ───────────────────
  useEffect(() => {
    if (!hasItinerary || (isStreaming && !preloadedTrip) || autoShareUrl || autoSaving) return
    deferStateUpdate(() => setAutoSaving(true))
    createAssistantTripShare({
      sessionToken: sessionToken ?? null,
      title: `Viaje a ${finalItineraryDays[0]?.destino || destination}`,
      destination: finalItineraryDays[0]?.destino || destination,
      days: finalItineraryDays.length,
      itinerary: finalItineraryDays,
      budget: finalBudgetResult ?? null,
      weather: finalWeatherResult ?? null,
    })
      .then((data) => {
        setAutoShareUrl(`/trip?token=${data.shareToken}`)
      })
      .catch((e) => console.error("Auto-save error:", e))
      .finally(() => setAutoSaving(false))
  }, [hasItinerary, isStreaming])

  // ── Skeleton visibility flags ──────────────────────────────────
  const showItinerarySkeleton = isStreaming && willGenerateItinerary && !hasItinerary
  const showBudgetSkeleton    = isStreaming && willCalculateBudget   && !hasBudget
  const showWeatherSkeleton   = isStreaming && willGetWeather        && !weatherResult

  return (
    <section className={styles.aiWorkspacePanel} aria-label="Workspace">

      {/* Tab bar */}
      <header className={styles.aiWorkspaceHeader}>
        <TabButton
          id="itinerario"
          label="Itinerario"
          icon={<CalendarDays size={12} />}
          active={activeTab === "itinerario"}
          dot={hasItinerary}
          pulsing={isStreaming && willGenerateItinerary && !hasItinerary}
          onClick={() => setActiveTab("itinerario")}
        />
        <TabButton
          id="presupuesto"
          label="Presupuesto"
          icon={<Wallet size={12} />}
          active={activeTab === "presupuesto"}
          dot={hasBudget}
          pulsing={isStreaming && willCalculateBudget && !hasBudget}
          onClick={() => setActiveTab("presupuesto")}
        />
        <TabButton
          id="mapa"
          label="Mapa"
          icon={<Map size={12} />}
          active={activeTab === "mapa"}
          dot={false}
          pulsing={false}
          onClick={() => setActiveTab("mapa")}
        />
      </header>

      {/* Share button */}
      {hasItinerary && (
        <div style={{padding: "6px 12px", borderBottom: "0.5px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8}}>
          {shareTokenFromAutoUrl && (
            <PdfButton shareToken={shareTokenFromAutoUrl} />
          )}
          <ShareButton
            sessionToken={sessionToken ?? null}
            itinerary={finalItineraryDays}
            budget={finalBudgetResult ?? null}
            weather={finalWeatherResult ?? null}
            destination={destination}
            days={finalItineraryDays.length}
            preloadedUrl={autoShareUrl}
          />
        </div>
      )}

      {/* Content */}
      <div className={styles.aiWorkspaceContent}>

        {/* ── Itinerario ─────────────────────────────────────────── */}
        {activeTab === "itinerario" && (
          hasItinerary ? (
            <div className="p-4">
              <ItineraryCard days={finalItineraryDays} />
            </div>
          ) : showItinerarySkeleton ? (
            <div className="p-4">
              <ItinerarySkeleton days={5} />
            </div>
          ) : (
            <WorkspaceEmpty
              icon="🗓"
              title="Sin itinerario aún"
              text="Cuéntame el destino, días y grupo para generar el itinerario."
            />
          )
        )}

        {/* ── Presupuesto ────────────────────────────────────────── */}
        {activeTab === "presupuesto" && (
          hasBudget ? (
            <div className="p-4 space-y-3">
              <BudgetCard budget={finalBudgetResult!} />
              {finalWeatherResult
                ? <WeatherCard weather={finalWeatherResult} />
                : showWeatherSkeleton && <WeatherSkeleton />
              }
            </div>
          ) : showBudgetSkeleton ? (
            <div className="p-4 space-y-3">
              <BudgetSkeleton />
              {showWeatherSkeleton && <WeatherSkeleton />}
            </div>
          ) : (
            <WorkspaceEmpty
              icon="💰"
              title="Sin presupuesto aún"
              text="Indica el número de viajeros y días para calcular el costo del viaje."
            />
          )
        )}

        {/* ── Mapa ──────────────────────────────────────────────── */}
        {activeTab === "mapa" && (
          <div className={styles.aiWorkspaceMap}>
            <div className={styles.aiMapOverlayTop}>
              <span className={styles.aiMapPill}>
                <Flag size={12} aria-hidden="true" />
                {destination}
              </span>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className={styles.aiMapPill}
                onClick={() => setSatellite((v) => !v)}
                style={{ cursor: "pointer" }}
                title={satellite ? "Vista mapa" : "Vista satélite"}
              >
                <Layers size={12} aria-hidden="true" />
                {satellite ? "Mapa" : "Satélite"}
              </button>
              <button
                type="button"
                className={`${styles.aiMapPill} ${styles.aiMapPillCta}`}
                onClick={onCreateTrip}
              >
                <Plus size={12} aria-hidden="true" />
                Crear viaje
              </button>
            </div>

            <TripMap markers={markers} height="100%" interactive satellite={satellite} />

            {selectedMatch ? (
              <div className={styles.aiMapMatchCard}>
                <p className={styles.aiMapMatchName}>{selectedMatch.trip_name}</p>
                <p className={styles.aiMapMatchDetail}>{selectedMatch.agency_name}</p>
              </div>
            ) : null}
          </div>
        )}

      </div>
    </section>
  )
}

// ── Sub-components ───────────────────────────────────────────────

function TabButton({
  label,
  icon,
  active,
  dot,
  pulsing,
  onClick,
}: {
  id: WorkspaceTab
  label: string
  icon: React.ReactNode
  active: boolean
  dot: boolean
  pulsing: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`${styles.aiWorkspaceTab} ${active ? styles.aiWorkspaceTabActive : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {icon}
      {label}
      {/* Green dot = has results  |  Purple pulsing dot = loading */}
      {dot && !pulsing && (
        <span className={styles.aiWorkspaceTabDot} aria-hidden="true" />
      )}
      {pulsing && (
        <span
          className="w-[5px] h-[5px] rounded-full bg-primary animate-pulse inline-block ml-0.5"
          aria-label="Generando…"
        />
      )}
    </button>
  )
}

function WorkspaceEmpty({
  icon,
  title,
  text,
}: {
  icon: string
  title: string
  text: string
}) {
  return (
    <div className={styles.aiWorkspaceEmpty}>
      <span className={styles.aiWorkspaceEmptyIcon}>{icon}</span>
      <p className={styles.aiWorkspaceEmptyTitle}>{title}</p>
      <p className={styles.aiWorkspaceEmptyText}>{text}</p>
    </div>
  )
}

// ── ShareButton ──────────────────────────────────────────────────

type ShareButtonProps = {
  sessionToken?: string | null
  itinerary: ItineraryDay[]
  budget?: BudgetResult | null
  weather?: WeatherResult | null
  destination: string
  days: number
  preloadedUrl?: string | null
}

function ShareButton({ sessionToken, itinerary, budget, weather, destination, days, preloadedUrl }: ShareButtonProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const effectiveUrl = preloadedUrl || shareUrl

  const handleShare = async () => {
    if (effectiveUrl) {
      navigator.clipboard.writeText(window.location.origin + effectiveUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }
    setLoading(true)
    try {
      const data = await createAssistantTripShare({
        sessionToken: sessionToken ?? null,
        title: `Viaje a ${destination}`,
        destination,
        days,
        itinerary,
        budget: budget ?? null,
        weather: weather ?? null,
      })
      const url = `/trip?token=${data.shareToken}`
      setShareUrl(url)
      navigator.clipboard.writeText(window.location.origin + url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 12, padding: "5px 12px",
        border: "0.5px solid #1D9E75", borderRadius: 8,
        background: copied ? "#1D9E75" : "transparent",
        color: copied ? "#fff" : "#1D9E75",
        cursor: loading ? "wait" : "pointer",
        transition: "all 0.2s",
      }}
    >
      {loading ? "Guardando..." : copied ? "¡Link copiado!" : "Compartir viaje"}
    </button>
  )
}

// ── PdfButton ─────────────────────────────────────────────────

function PdfButton({ shareToken }: { shareToken: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (!shareToken) return
    setLoading(true)
    try {
      const blob = await downloadAssistantTripPdf(shareToken)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `viaje-totem-${shareToken.slice(0,8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("PDF error:", e)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 12, padding: "5px 12px",
        border: "0.5px solid #6b7280", borderRadius: 8,
        background: "transparent", color: "#6b7280",
        cursor: loading ? "wait" : "pointer",
        transition: "all 0.2s",
      }}
    >
      {loading ? "Generando..." : "⬇ Descargar PDF"}
    </button>
  )
}
