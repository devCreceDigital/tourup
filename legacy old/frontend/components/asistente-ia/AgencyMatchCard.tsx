"use client"

import { useState } from "react"
import type { MatchResult } from "@/types"

interface AgencyMatchCardProps {
  match: MatchResult
  onContact: (match: MatchResult) => void
  onViewDetail: (match: MatchResult) => void
}

export default function AgencyMatchCard({ match, onContact }: AgencyMatchCardProps) {
  const [showHighlights, setShowHighlights] = useState(false)
  const score = Math.round((match.match_score || 0) * 100)

  const scoreBadge =
    score >= 90
      ? "bg-successbg text-success"
      : score >= 70
      ? "bg-warningbg text-warning"
      : "bg-infobg text-info"

  return (
    <>
      <article className="border border-border rounded-card p-3 bg-white">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-badge ${scoreBadge}`}>
            🏆 {score}%
          </span>
          <span className="text-sm font-semibold text-text truncate">{match.agency_name}</span>
        </div>

        {match.agency_rating !== null ? (
          <p className="text-xs text-textsecondary mb-2">⭐ {match.agency_rating.toFixed(1)}</p>
        ) : null}

        <p className="text-sm font-medium text-text">
          {match.trip_name} — {match.duration_days}D
        </p>
        <p className="text-xs text-textsecondary mt-1">
          📅 Próxima salida: {match.next_departure ?? "Por confirmar"}
        </p>
        <p className="text-xs text-textsecondary mt-0.5">
          💺 {match.available_seats} plazas &nbsp;·&nbsp; 💰 Desde {match.currency}{" "}
          {match.price_from}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHighlights(true)}
            className="text-xs px-3 py-1.5 rounded-btn border border-border text-text hover:bg-bgtablehover"
          >
            Ver itinerario
          </button>
          <button
            type="button"
            onClick={() => onContact(match)}
            className="text-xs px-3 py-1.5 rounded-btn bg-primary text-white hover:bg-primary-hover"
          >
            Contactar →
          </button>
        </div>
      </article>

      {showHighlights ? (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
          onClick={() => setShowHighlights(false)}
        >
          <div
            className="bg-white rounded-cardlg shadow-lg max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-base font-semibold text-text">
                {match.trip_name} — {match.duration_days}D
              </h4>
              <button
                type="button"
                onClick={() => setShowHighlights(false)}
                className="ml-4 text-textsecondary hover:text-text"
              >
                ✕
              </button>
            </div>
            {match.highlights.length > 0 ? (
              <ul className="space-y-1.5">
                {match.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-text flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-textsecondary">Sin detalles disponibles.</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
