"use client"

import type { LeadRecord, LeadStatus } from "@/shared/domain/totem-types"

interface LeadsTableProps {
  leads: LeadRecord[]
  onSelectLead: (lead: LeadRecord) => void
  statusFilter: LeadStatus | "all"
  onFilterChange: (s: LeadStatus | "all") => void
}

const TABS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all",       label: "Todos" },
  { value: "new",       label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "converted", label: "Convertido" },
]

const STATUS_STYLE: Record<LeadStatus, string> = {
  new:       "bg-successbg text-success",
  contacted: "bg-warningbg text-warning",
  converted: "bg-primary-light text-primary",
  closed:    "bg-bgcardalt text-textsecondary",
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new:       "Nuevo",
  contacted: "Contactado",
  converted: "Convertido",
  closed:    "Cerrado",
}

function formatRelative(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1)  return "< 1h"
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return d === 1 ? "ayer" : `${d}d`
}

export default function LeadsTable({ leads, onSelectLead, statusFilter, onFilterChange }: LeadsTableProps) {
  const filtered = statusFilter === "all" ? leads : leads.filter((l) => l.status === statusFilter)

  return (
    <div className="rounded-card border border-border bg-white overflow-hidden">
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onFilterChange(tab.value)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              statusFilter === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-textsecondary hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-textsecondary">
          No hay leads en este estado.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-bgtableheader text-xs text-textsecondary">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Viajero</th>
              <th className="px-4 py-2.5 text-left font-medium">Destino</th>
              <th className="px-4 py-2.5 text-left font-medium">Match</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
              <th className="px-4 py-2.5 text-left font-medium">Recibido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderlight">
            {filtered.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="cursor-pointer hover:bg-bgtablehover transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{lead.traveler_name}</p>
                  <p className="text-xs text-textsecondary">{lead.traveler_email}</p>
                </td>
                <td className="px-4 py-3 text-textsecondary">
                  {lead.intent_data.destination ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium text-text">
                  {Math.round(lead.match_score * 100)}%
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-badge font-medium ${STATUS_STYLE[lead.status]}`}>
                    {STATUS_LABEL[lead.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-textsecondary">
                  {formatRelative(lead.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
