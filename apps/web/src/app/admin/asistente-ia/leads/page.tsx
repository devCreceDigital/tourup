"use client"

import { useState, useEffect, useCallback } from "react"
import type { LeadRecord, LeadStatus } from "@/shared/domain/totem-types"
import { fetchAssistant } from "@/shared/api/assistant-api-client"
import LeadsTable from "@/contexts/assistant/ui/components/LeadsTable"
import LeadDetailModal from "@/contexts/assistant/ui/components/LeadDetailModal"

export default function AsistenteIALeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all")
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null)

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true)
      const qs = statusFilter !== "all" ? `?status=${statusFilter}` : ""
      const res = await fetchAssistant(`/agency/leads/${qs}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [])
      }
    } catch {
      // show empty state on error
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    const t = setTimeout(() => {
      void loadLeads()
    }, 0)
    return () => clearTimeout(t)
  }, [loadLeads])

  const handleMarkContacted = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: "contacted" as LeadStatus } : l))
    )
    setSelectedLead((prev) =>
      prev?.id === leadId ? { ...prev, status: "contacted" as LeadStatus } : prev
    )
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-text">Leads de Asistente IA</h1>
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-bgcardalt rounded-card" />
          ))}
        </div>
      ) : (
        <LeadsTable
          leads={leads}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          onSelectLead={setSelectedLead}
        />
      )}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={selectedLead !== null}
        onClose={() => setSelectedLead(null)}
        onMarkContacted={handleMarkContacted}
      />
    </div>
  )
}
