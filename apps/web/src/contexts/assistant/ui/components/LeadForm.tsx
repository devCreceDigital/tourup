"use client"

import { useState } from "react"
import type { MatchResult, LeadFormData } from "@/shared/domain/totem-types"

interface LeadFormProps {
  isOpen: boolean
  onClose: () => void
  match: MatchResult
  sessionToken: string
  submitLeadAction: (data: LeadFormData) => Promise<string>
  onSuccess: (leadId: string) => void
}

export default function LeadForm({
  isOpen,
  onClose,
  match,
  sessionToken,
  submitLeadAction,
  onSuccess,
}: LeadFormProps) {
  const [form, setForm] = useState<LeadFormData>({
    traveler_name: "",
    traveler_email: "",
    traveler_msg: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const isValid =
    form.traveler_name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(form.traveler_email.trim()) &&
    Boolean(sessionToken)

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return
    setError(null)
    setIsSubmitting(true)
    try {
      const leadId = await submitLeadAction(form)
      onSuccess(leadId)
      onClose()
      setForm({ traveler_name: "", traveler_email: "", traveler_msg: "" })
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la consulta")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <aside className="w-full sm:w-[420px] h-full bg-white border-l border-border p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Contactar agencia</h3>
          <button type="button" onClick={onClose} className="text-sm text-textsecondary">
            Cerrar
          </button>
        </div>
        <p className="text-xs text-textsecondary mb-4">
          Viaje: {match.trip_name} · Match {Math.round(match.match_score * 100)}%
        </p>
        <div className="space-y-3">
          <input
            value={form.traveler_name}
            onChange={(e) => setForm((prev) => ({ ...prev, traveler_name: e.target.value }))}
            className="w-full rounded-btn border border-borderinput px-3 py-2 text-sm"
            placeholder="Nombre completo"
          />
          <input
            value={form.traveler_email}
            onChange={(e) => setForm((prev) => ({ ...prev, traveler_email: e.target.value }))}
            className="w-full rounded-btn border border-borderinput px-3 py-2 text-sm"
            placeholder="Correo electrónico"
            type="email"
          />
          <textarea
            value={form.traveler_msg}
            onChange={(e) => setForm((prev) => ({ ...prev, traveler_msg: e.target.value }))}
            className="w-full h-28 rounded-btn border border-borderinput px-3 py-2 text-sm resize-none"
            placeholder="Mensaje para la agencia (opcional)"
          />
        </div>
        {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="mt-4 w-full text-sm px-3 py-2 rounded-btn bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {isSubmitting ? "Enviando..." : "Enviar consulta"}
        </button>
      </aside>
    </div>
  )
}
