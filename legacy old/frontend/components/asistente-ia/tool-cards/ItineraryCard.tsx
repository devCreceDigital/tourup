import type { ItineraryDay } from "@/types"
import { CalendarDays, MapPin } from "lucide-react"

const DAY_ICONS = ["🌅", "🏛", "🏔", "🌾", "🛍", "🎭", "🌊"]

interface ItineraryCardProps {
  days: ItineraryDay[]
}

export default function ItineraryCard({ days }: ItineraryCardProps) {
  if (!days.length) return null
  const destination = days[0]?.destino ?? "Destino"

  return (
    <div className="rounded-[10px] border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F5F7] border-b border-border">
        <CalendarDays size={14} className="text-primary shrink-0" />
        <span className="text-xs font-semibold text-[#1A1A2E]">
          Itinerario — {destination}
        </span>
        <span className="ml-auto text-[10px] text-[#9CA3AF]">
          {days.length} {days.length === 1 ? "día" : "días"}
        </span>
      </div>

      {/* Days */}
      <ul className="divide-y divide-[#F4F5F7]">
        {days.map((day, i) => (
          <li key={day.dia} className="flex items-start gap-2.5 px-3 py-2">
            {/* Day badge */}
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <span className="text-base leading-none">{DAY_ICONS[i % DAY_ICONS.length]}</span>
              <span className="text-[9px] font-bold text-[#9CA3AF] mt-0.5">
                DÍA {day.dia}
              </span>
            </div>

            {/* Activity */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#1A1A2E] leading-snug">{day.actividad}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={9} className="text-[#9CA3AF]" />
                <span className="text-[10px] text-[#9CA3AF]">{day.destino}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
