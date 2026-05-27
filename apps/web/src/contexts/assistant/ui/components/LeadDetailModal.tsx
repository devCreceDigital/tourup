"use client"

import type { LeadRecord } from "@/shared/domain/totem-types"
import { fetchAssistant } from "@/shared/api/assistant-api-client"

interface LeadDetailModalProps {
  lead:            LeadRecord | null
  isOpen:          boolean
  onClose:         () => void
  onMarkContacted: (leadId: string) => void
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-textsecondary mb-0.5">{label}</p>
      <p className="text-sm text-text">{value ?? "—"}</p>
    </div>
  )
}

export default function LeadDetailModal({ lead, isOpen, onClose, onMarkContacted }: LeadDetailModalProps) {
  if (!isOpen || !lead) return null

  const score   = Math.round(lead.match_score * 100)
  const created = new Date(lead.created_at).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  const handleMarkContacted = async () => {
    try {
      await fetchAssistant(`/agency/leads/${lead.id}/status/`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "contacted" }),
      })
    } catch {
      // optimistic update regardless of network failure
    }
    onMarkContacted(lead.id)
  }

  const mailtoHref = `mailto:${lead.traveler_email}?subject=${encodeURIComponent(
    `Re: Tu consulta sobre ${lead.trip_name}`
  )}`

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-cardlg shadow-lg max-w-lg w-full p-5 space-y-4 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold text-text">Lead de Asistente IA</h3>
          <button type="button" onClick={onClose} className="ml-4 text-textsecondary hover:text-text">
            ✕
          </button>
        </div>

        <div className="rounded-card border border-border p-3 space-y-1">
          <p className="text-sm font-medium text-text">
            👤 {lead.traveler_name}
            <span className="font-normal text-textsecondary"> · {lead.traveler_email}</span>
          </p>
          <p className="text-xs text-textsecondary">📅 Recibido: {created}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-textlabel uppercase tracking-wide mb-2">
            Intención detectada
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Field label="Destino"      value={lead.intent_data.destination} />
            <Field label="Duración"     value={lead.intent_data.duration} />
            <Field label="Tipo grupo"   value={lead.intent_data.group_type} />
            <Field label="N.º personas" value={lead.intent_data.group_size} />
            <Field label="Período"      value={lead.intent_data.departure_month} />
            <Field label="Presupuesto"  value={lead.intent_data.budget_range} />
          </div>
          {(lead.intent_data.interests?.length ?? 0) > 0 ? (
            <div className="mt-2">
              <p className="text-xs text-textsecondary mb-0.5">Intereses</p>
              <p className="text-sm text-text">{lead.intent_data.interests?.join(", ")}</p>
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold text-textlabel uppercase tracking-wide mb-1">
            Viaje consultado
          </p>
          <p className="text-sm font-medium text-text">
            {lead.trip_name} · Match {score}%
          </p>
        </div>

        {lead.traveler_msg ? (
          <div>
            <p className="text-xs font-semibold text-textlabel uppercase tracking-wide mb-1">
              Mensaje del viajero
            </p>
            <p className="text-sm text-text italic">{`"${lead.traveler_msg}"`}</p>
          </div>
        ) : null}

        <div className="flex items-center gap-3 pt-2 border-t border-borderlight">
          <a
            href={mailtoHref}
            className="text-sm px-3 py-1.5 rounded-btn border border-border text-text hover:bg-bgtablehover"
          >
            Responder al viajero
          </a>
          {lead.status !== "contacted" && lead.status !== "converted" ? (
            <button
              type="button"
              onClick={() => void handleMarkContacted()}
              className="text-sm px-3 py-1.5 rounded-btn bg-primary text-white hover:bg-primary-hover"
            >
              Marcar como contactado
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
