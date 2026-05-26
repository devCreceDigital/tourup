"use client"

import { useMemo } from "react"
import { Map } from "lucide-react"
import { resolveDestinations } from "@/lib/geoHelper"
import TripMap from "@/components/shared/TripMap"

interface DestinationMapSectionProps {
  destino: string
}

export default function DestinationMapSection({ destino }: DestinationMapSectionProps) {
  const markers = useMemo(() => resolveDestinations(destino), [destino])

  if (!markers.length) return null

  return (
    <section className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-6 pt-5 pb-4">
        <Map className="w-5 h-5 text-[#00B4FC]" />
        <h2 className="text-lg font-black text-[#1E1E4E]">Ruta del viaje</h2>
      </div>

      <div className="relative h-64 sm:h-80">
        <TripMap markers={markers} height="100%" showRoute />
      </div>

      {markers.length > 1 && (
        <div className="px-6 py-3 flex flex-wrap gap-3 border-t border-gray-100">
          {markers.map((m, i) => (
            <span
              key={m.label}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600"
            >
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-black shrink-0"
                style={{
                  background: ["#5B4FE8", "#00D4C8", "#EF4444", "#F59E0B", "#1A8A4A", "#8B5CF6"][
                    i % 6
                  ],
                }}
              >
                {i + 1}
              </span>
              {m.label}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
