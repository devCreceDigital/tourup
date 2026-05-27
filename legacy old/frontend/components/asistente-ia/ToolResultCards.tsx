import type {
  BudgetResult,
  HotelsResult,
  ItineraryDay,
  ToolResultItem,
  WeatherResult,
} from "@/types"
import ItineraryCard from "./tool-cards/ItineraryCard"
import BudgetCard    from "./tool-cards/BudgetCard"
import WeatherCard   from "./tool-cards/WeatherCard"
import HotelsCard    from "./tool-cards/HotelsCard"

interface ToolResultCardsProps {
  toolResults: ToolResultItem[]
}

export default function ToolResultCards({ toolResults }: ToolResultCardsProps) {
  if (!toolResults.length) return null

  return (
    <div className="mt-2 space-y-2">
      {toolResults.map((item, index) => (
        <ToolCard key={`${item.tool_name}-${index}`} item={item} />
      ))}
    </div>
  )
}

function ToolCard({ item }: { item: ToolResultItem }) {
  const { tool_name, result } = item

  if (tool_name === "generate_itinerary" && Array.isArray(result)) {
    const days = result as ItineraryDay[]
    if (!days.length) return null
    return <ItineraryCard days={days} />
  }

  if (tool_name === "calculate_budget" && result && typeof result === "object" && !Array.isArray(result)) {
    const budget = result as BudgetResult
    if (!budget.total_soles) return null
    return <BudgetCard budget={budget} />
  }

  if (tool_name === "get_weather" && result && typeof result === "object" && !Array.isArray(result)) {
    const weather = result as WeatherResult
    if (!weather.temperature) return null
    return <WeatherCard weather={weather} />
  }

  if (tool_name === "buscar_hoteles" && result && typeof result === "object" && !Array.isArray(result)) {
    const hotels = result as HotelsResult
    if (!hotels.hoteles?.length) return null
    return <HotelsCard hotels={hotels} />
  }

  // Flights, routes, places — no custom card yet, skip silently
  return null
}
