"use client"

import { useState } from "react"
import type { MatchResult } from "@/types"
import type { GeoPoint } from "@/lib/geoHelper"
import { Calendar, Flag, Layers, Plus } from "lucide-react"
import TripMap from "@/components/shared/TripMap"
import styles from "./asistente-ia.module.css"

interface MapPanelProps {
  selectedMatch: MatchResult | null
  markers: GeoPoint[]
  pills?: {
    destination?: string
    durationLabel?: string
  }
  onCreateTrip?: () => void
}

export default function MapPanel({ selectedMatch, markers, pills, onCreateTrip }: MapPanelProps) {
  const [satellite, setSatellite] = useState(false)

  return (
    <section className={styles.aiMapPanel} aria-label="Mapa de destinos">
      {/* Overlay superior: pills + controles */}
      <div className={styles.aiMapOverlayTop}>
        <span className={styles.aiMapPill}>
          <Flag size={12} aria-hidden="true" />
          {pills?.destination ?? "Destino"}
        </span>
        {pills?.durationLabel && pills.durationLabel !== "—" && (
          <span className={styles.aiMapPill}>
            <Calendar size={12} aria-hidden="true" />
            {pills.durationLabel}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className={styles.aiMapPill}
          onClick={() => setSatellite((v) => !v)}
          title={satellite ? "Vista mapa" : "Vista satélite"}
          style={{ cursor: "pointer" }}
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

      {/* Mapa real interactivo */}
      <div className={styles.aiMapPlaceholder}>
        <TripMap
          markers={markers}
          height="100%"
          interactive
          satellite={satellite}
        />
      </div>

      {/* Card de viaje seleccionado */}
      {selectedMatch ? (
        <div className={styles.aiMapMatchCard}>
          <p className={styles.aiMapMatchName}>{selectedMatch.trip_name}</p>
          <p className={styles.aiMapMatchDetail}>{selectedMatch.agency_name}</p>
        </div>
      ) : null}
    </section>
  )
}
