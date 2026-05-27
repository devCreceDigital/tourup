"use client"

interface AIFollowUpCardProps {
  text: string
  onChipClick: (text: string) => void
}

/**
 * Detecta qué opciones mostrar según lo que el asistente PREGUNTA.
 * Los patrones buscan frases interrogativas del asistente, no palabras
 * sueltas que podrían estar en cualquier respuesta.
 */
function getContextualChips(text: string): string[] {
  const t = text.toLowerCase()

  // ¿Sudamérica o dentro del país?
  if (/dentro del pa[ií]s.*sudam[eé]rica|sudam[eé]rica.*dentro del pa[ií]s|viajar.*dentro.*pa[ií]s|pa[ií]s.*sudam[eé]rica/.test(t))
    return ["Perú", "Colombia", "Chile", "Argentina"]

  // ¿Costa / Sierra / Selva?
  if (/costa.*sierra.*selva|sierra.*selva|región.*peruana|zona.*país/.test(t))
    return ["Costa", "Sierra", "Selva"]

  // ¿Cuánto tiempo / duración? — solo cuando la pregunta lo pide explícitamente
  if (/¿cu[aá]nto tiempo|¿cu[aá]ntos d[ií]as|tiempo.*quieres viajar|duración.*viaje/.test(t))
    return ["3 a 5 días", "1 semana", "2 semanas o más"]

  // ¿Cuántas personas?
  if (/¿cu[aá]ntas personas|¿cu[aá]ntos viajan|¿cu[aá]ntos son/.test(t))
    return ["Solos/pareja", "Familia pequeña (3-4)", "Grupo grande (+8)"]

  // ¿Presupuesto?
  if (/¿cu[aá]nto.*gastar|¿cu[aá]l.*presupuesto|presupuesto.*manejas|presupuesto.*consideras/.test(t))
    return ["Menos de S/500", "Entre S/500 y S/1500", "Más de S/1500"]

  // ¿Destino?
  if (/¿.*d[oó]nde.*viajar|¿.*destino.*tienes|¿.*pa[ií]s.*piensas/.test(t))
    return ["Dentro del país", "Sudamérica", "Me da igual el destino"]

  // ¿Interés / tipo de experiencia?
  if (/¿.*tipo de (experiencia|viaje|actividad)|¿.*qué.*gusta.*hacer|¿.*prefieres.*playa|¿.*interesa/.test(t))
    return ["Playa y relax", "Aventura y naturaleza", "Cultura e historia"]

  // ¿Cuándo / mes?
  if (/¿.*cu[aá]ndo.*viajar|¿.*mes.*piensas|¿.*[eé]poca.*año|¿.*temporada/.test(t))
    return ["En el próximo mes", "En 3 meses", "Estoy flexible"]

  // ¿Niños?
  if (/¿.*viajan ni[ñn]os|¿.*hay ni[ñn]os|¿.*familia.*ni[ñn]os/.test(t))
    return ["Sin niños", "Niños pequeños", "Adolescentes"]

  return []
}

export default function AIFollowUpCard({ text, onChipClick }: AIFollowUpCardProps) {
  const chips = getContextualChips(text)
  if (!chips.length) return null

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onChipClick(chip)}
          className="text-xs px-3 py-1.5 rounded-badge border border-primary text-primary bg-white hover:bg-primary hover:text-white transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
