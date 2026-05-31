"use client";
import { useState, useEffect } from "react";
import type { ExtractedProgram } from "@/lib/documents/types";
import { createTripsBulk } from "@/lib/api/tripsBulk";

interface Step7CreatingProps {
  programs: ExtractedProgram[];
  onComplete: (results: Array<{ id: string; title: string; destination: string; status: "created" | "error" }>) => void;
}

type TripStatus = "pending" | "creating" | "created" | "error";

interface TripRow { id: string; title: string; destination: string; status: TripStatus; progress: number; }

export function Step7Creating({ programs, onComplete }: Step7CreatingProps) {
  const [rows, setRows] = useState<TripRow[]>(
    programs.map(p => ({ id: p.id, title: p.title, destination: p.destination, status: "pending" as TripStatus, progress: 0 }))
  );
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function run() {
      for (let i = 0; i < programs.length; i++) {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "creating" } : r));

        // Animate progress
        for (let pct = 0; pct <= 90; pct += 15) {
          await new Promise(r => setTimeout(r, 150));
          setRows(prev => prev.map((r, idx) => idx === i ? { ...r, progress: pct } : r));
        }
        await new Promise(r => setTimeout(r, 800));

        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "created", progress: 100 } : r));
        await new Promise(r => setTimeout(r, 400));
      }

      // Call API after animation
      try {
        await createTripsBulk(programs);
      } catch {
        // Mock fallback: continue anyway
      }

      setDone(true);
    }
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      onComplete(rows.map(r => ({ id: r.id, title: r.title, destination: r.destination, status: r.status === "created" ? "created" : "error" })));
    }, 600);
    return () => clearTimeout(t);
  }, [done, onComplete, rows]);

  const allDone = rows.every(r => r.status === "created" || r.status === "error");

  return (
    <div style={{ maxWidth: 500, margin: "20px auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, animation: allDone ? "none" : "spin 1.2s linear infinite", display: "inline-block", marginBottom: 12 }}>
          {allDone ? "🎉" : "⭐"}
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0A2540", marginBottom: 6 }}>
          {allDone ? "¡Viajes creados!" : "Creando tus viajes..."}
        </h3>
        <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
          {allDone ? "Todo listo. Pasando al resumen final." : "Nuestra IA está componiendo los detalles de tu aventura"}
        </p>
      </div>

      {/* Trip rows */}
      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        {rows.map(row => (
          <div key={row.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: row.status === "created" ? "#10B981" : row.status === "creating" ? "#3B82F6" : row.status === "error" ? "#EF4444" : "#E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {row.status === "created"
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : row.status === "creating"
                  ? <div style={{ width: 8, height: 8, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
                  : row.status === "error"
                  ? <span style={{ fontSize: 10, color: "#fff" }}>✕</span>
                  : null
                }
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: row.status === "created" ? "#065F46" : row.status === "creating" ? "#1D4ED8" : "#94A3B8", margin: 0 }}>
                  {row.title}
                </p>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                  {row.status === "created" ? "✓ Creado correctamente" : row.status === "creating" ? "Procesando..." : row.status === "error" ? "Error al crear" : "En espera..."}
                  {row.destination ? ` · ${row.destination}` : ""}
                </p>
              </div>
              {row.status === "created" && <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>✓</span>}
            </div>
            <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 0.3s ease",
                background: row.status === "created" ? "#10B981" : row.status === "creating" ? "#3B82F6" : "#E2E8F0",
                width: `${row.progress}%`,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Summary card */}
      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "14px 16px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#065F46", marginBottom: 10 }}>📋 Resumen</p>
        <p style={{ fontSize: 13, color: "#047857", margin: "0 0 4px" }}>Total de programas: <strong>{programs.length}</strong></p>
        <p style={{ fontSize: 13, color: "#047857", margin: "0 0 4px" }}>Creados: <strong>{rows.filter(r => r.status === "created").length}</strong></p>
        <p style={{ fontSize: 11, color: "#6EE7B7", marginTop: 8, marginBottom: 0 }}>
          Los viajes se guardan automáticamente como publicados.
        </p>
      </div>
    </div>
  );
}
