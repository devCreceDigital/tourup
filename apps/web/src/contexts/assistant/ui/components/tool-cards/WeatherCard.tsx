import type { WeatherResult } from "@/shared/domain/totem-types"
import { CalendarCheck, Thermometer } from "lucide-react"

const CONDITION_ICONS: Record<string, string> = {
  "Soleado":       "☀️",
  "Nublado":       "☁️",
  "Lluvia ligera": "🌦",
  "Húmedo":        "💧",
  "Nevado":        "❄️",
  "Ventoso":       "💨",
}

function conditionIcon(condition: string): string {
  for (const [key, icon] of Object.entries(CONDITION_ICONS)) {
    if (condition.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return "🌤"
}

interface WeatherCardProps {
  weather: WeatherResult
  city?: string
}

export default function WeatherCard({ weather, city }: WeatherCardProps) {
  const icon = conditionIcon(weather.condition)

  return (
    <div className="rounded-[10px] border border-border bg-white">
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Icon + temp */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-2xl leading-none">{icon}</span>
          <div>
            <div className="flex items-center gap-1">
              <Thermometer size={11} className="text-[#9CA3AF]" />
              <span className="text-sm font-bold text-[#1A1A2E]">{weather.temperature}</span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] leading-none mt-0.5">{weather.condition}</p>
          </div>
        </div>

        <div className="w-px h-8 bg-border shrink-0" />

        {/* Best time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
            <CalendarCheck size={10} />
            <span>Mejor época</span>
          </div>
          <p className="text-xs font-medium text-[#1A1A2E] mt-0.5 truncate">
            {weather.best_time}
          </p>
          {city ? (
            <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">{city}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
