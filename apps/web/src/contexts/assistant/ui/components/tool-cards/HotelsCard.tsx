import type { HotelsResult } from "@/shared/domain/totem-types"
import { Building2, Star } from "lucide-react"

const PRICE_COLOR: Record<string, string> = {
  "Económico": "#1A8A4A",
  "Moderado":  "#F59E0B",
  "Caro":      "#EF4444",
  "Muy caro":  "#EF4444",
  "Gratis":    "#1A8A4A",
}

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const frac  = rating - full
  const empty = 5 - full - (frac > 0 ? 1 : 0)
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} size={9} className="fill-[#F59E0B] text-[#F59E0B]" />
      ))}
      {frac > 0 && <Star size={9} className="fill-[#FDE68A] text-[#F59E0B]" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} size={9} className="fill-none text-[#E0E4EF]" />
      ))}
      <span className="text-[10px] text-[#6B7280] ml-0.5">{rating.toFixed(1)}</span>
    </span>
  )
}

interface HotelsCardProps {
  hotels: HotelsResult
}

export default function HotelsCard({ hotels }: HotelsCardProps) {
  const list = hotels.hoteles.slice(0, 4)
  if (!list.length) return null

  return (
    <div className="rounded-[10px] border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F5F7] border-b border-border">
        <Building2 size={14} className="text-primary shrink-0" />
        <span className="text-xs font-semibold text-[#1A1A2E]">
          Hoteles en {hotels.destino}
        </span>
        <span className="ml-auto text-[10px] text-[#9CA3AF]">{hotels.total} encontrados</span>
      </div>

      {/* List */}
      <ul className="divide-y divide-[#F4F5F7]">
        {list.map((hotel, i) => (
          <li key={`${hotel.nombre}-${i}`} className="flex items-center gap-2 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1A1A2E] truncate">{hotel.nombre}</p>
              <StarRating rating={hotel.rating} />
            </div>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                color: PRICE_COLOR[hotel.precio_nivel] ?? "#6B7280",
                backgroundColor: `${PRICE_COLOR[hotel.precio_nivel] ?? "#6B7280"}15`,
              }}
            >
              {hotel.precio_nivel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
