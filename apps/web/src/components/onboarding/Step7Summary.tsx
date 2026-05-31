"use client";
import type { ExtractedProgram } from "@/lib/documents/types";

interface Step7SummaryProps {
  programs: ExtractedProgram[];
  fileName: string;
  onCreateTrips: () => void;
  onEdit: () => void;
  onSkip: () => void;
}

export function Step7Summary({ programs, fileName, onCreateTrips, onEdit, onSkip }: Step7SummaryProps) {
  const uniqueDestinations = new Set(programs.map(p => p.destination).filter(Boolean)).size;
  const fieldsIdentified = programs.reduce((acc, p) => {
    let count = 0;
    if (p.title) count++;
    if (p.description) count++;
    if (p.destination) count++;
    if (p.dateStart) count++;
    if (p.durationDays) count++;
    if (p.priceFrom) count++;
    if (p.activities.length) count++;
    if (p.includes.length) count++;
    return acc + count;
  }, 0);
  const avgConfidence = programs.length
    ? Math.round(programs.reduce((a, p) => a + p.confidence, 0) / programs.length)
    : 0;

  const stats = [
    { num: programs.length, label: "Programas detectados", icon: "📋", bg: "#F0F9FF" },
    { num: fieldsIdentified, label: "Campos identificados", icon: "📝", bg: "#FEF3C7" },
    { num: uniqueDestinations, label: "Destinos únicos", icon: "🌍", bg: "#ECFDF5" },
    { num: `${avgConfidence}%`, label: "Confiabilidad promedio", icon: "✅", bg: "#F0FDF4" },
  ];

  function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  return (
    <div style={{ maxWidth: 640, margin: "20px auto" }}>
      {/* Info badge */}
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>📊</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#1E40AF", marginBottom: 4 }}>PASO 3 DE 5 — RESUMEN DE INFORMACIÓN</p>
          <p style={{ fontSize: 13, color: "#1E40AF", margin: 0 }}>
            Aquí está todo lo que detecté. Si ves algo que necesita ajuste, puedes volver atrás para editar.
          </p>
        </div>
      </div>

      {/* Summary table */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Programa", "Destino", "Fechas", "Duración", "Precio", "Confiabilidad"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {programs.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < programs.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0A2540", maxWidth: 160 }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{p.title}</div>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#475569", whiteSpace: "nowrap" }}>{p.destination || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#475569", whiteSpace: "nowrap" }}>
                    {p.dateStart ? `${formatDate(p.dateStart)}${p.dateEnd ? ` - ${formatDate(p.dateEnd)}` : ""}` : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#475569", whiteSpace: "nowrap" }}>
                    {p.durationDays > 0 ? `${p.durationDays} días` : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#475569", whiteSpace: "nowrap" }}>
                    {p.priceFrom > 0 ? `$${p.priceFrom.toLocaleString()}${p.priceTo ? `–$${p.priceTo.toLocaleString()}` : ""}` : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: p.confidence >= 70 ? "#ECFDF5" : "#FFFBEB", color: p.confidence >= 70 ? "#065F46" : "#92400E" }}>
                      {p.confidence >= 70 ? "✓" : "⚠️"} {p.confidence}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: s.bg, border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#0A2540", margin: 0, lineHeight: 1 }}>{s.num}</p>
              <p style={{ fontSize: 11, color: "#64748B", margin: 0, marginTop: 2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* File info */}
      <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Detectado desde: <strong>{fileName}</strong></p>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onCreateTrips}
          style={{ width: "100%", background: "#10B981", color: "#fff", border: "none", borderRadius: 10, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
        >
          🚀 Crear mis viajes automáticamente
        </button>
        <button onClick={onEdit}
          style={{ width: "100%", background: "#fff", color: "#0A2540", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
          ← Editar información
        </button>
        <button onClick={onSkip}
          style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: "4px" }}>
          Lo haré luego
        </button>
      </div>
    </div>
  );
}
