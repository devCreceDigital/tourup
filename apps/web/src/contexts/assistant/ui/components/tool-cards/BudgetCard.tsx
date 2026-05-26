import type { BudgetResult } from "@/shared/domain/totem-types"
import { Users, Wallet } from "lucide-react"

const CATEGORY_LABELS: Record<string, string> = {
  economico: "Económico",
  moderado:  "Moderado",
  premium:   "Premium",
}

const BREAKDOWN_LABELS: Record<string, string> = {
  hospedaje:    "Hospedaje",
  alimentacion: "Alimentación",
  transporte:   "Transporte",
  extras:       "Extras",
}

const BREAKDOWN_COLORS: Record<string, string> = {
  hospedaje:    "#5B4FE8",
  alimentacion: "#00D4C8",
  transporte:   "#F59E0B",
  extras:       "#9CA3AF",
}

function fmt(n: number) {
  return n.toLocaleString("es-PE")
}

interface BudgetCardProps {
  budget: BudgetResult
}

export default function BudgetCard({ budget }: BudgetCardProps) {
  const { breakdown, total_soles, per_person, travelers, days, category } = budget
  const entries = Object.entries(breakdown) as [keyof typeof breakdown, number][]

  return (
    <div className="rounded-[10px] border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F5F7] border-b border-border">
        <Wallet size={14} className="text-primary shrink-0" />
        <span className="text-xs font-semibold text-[#1A1A2E]">Presupuesto estimado</span>
        <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
          {CATEGORY_LABELS[category] ?? category}
        </span>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Totals */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-lg font-bold text-[#1A1A2E]">
              S/. {fmt(total_soles)}
            </span>
            <span className="text-[10px] text-[#9CA3AF] ml-1">total</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-primary">
              S/. {fmt(per_person)}
            </span>
            <span className="text-[10px] text-[#9CA3AF] ml-1">/ persona</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
          <Users size={10} />
          <span>{travelers} personas · {days} días</span>
        </div>

        {/* Breakdown bars */}
        <ul className="space-y-1.5">
          {entries.map(([key, amount]) => {
            const pct = total_soles > 0 ? Math.round((amount / total_soles) * 100) : 0
            const color = BREAKDOWN_COLORS[key] ?? "#9CA3AF"
            return (
              <li key={key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-[#4B5563]">
                    {BREAKDOWN_LABELS[key] ?? key}
                  </span>
                  <span className="text-[11px] font-medium text-[#1A1A2E]">
                    S/. {fmt(amount)}
                    <span className="text-[9px] text-[#9CA3AF] ml-1">{pct}%</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#F4F5F7] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
