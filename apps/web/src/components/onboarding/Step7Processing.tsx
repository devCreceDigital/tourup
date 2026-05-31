"use client";
import { useState, useEffect } from "react";

interface Step7ProcessingProps {
  fileName: string;
  fileSize: number;
  detectedFormat: string;
}

const SUBMESSAGES = [
  "Buscando destinos...",
  "Analizando fechas...",
  "Extrayendo itinerarios...",
  "Identificando actividades...",
  "Detectando precios...",
  "Estructurando programas...",
];

export function Step7Processing({ fileName, fileSize, detectedFormat }: Step7ProcessingProps) {
  const [step, setStep] = useState(0);
  const [subMsgIdx, setSubMsgIdx] = useState(0);
  const [extractProgress, setExtractProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (step < 1) return;
    const interval = setInterval(() => {
      setExtractProgress(p => Math.min(p + 8, 95));
      setSubMsgIdx(p => (p + 1) % SUBMESSAGES.length);
    }, 600);
    return () => clearInterval(interval);
  }, [step]);

  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1);

  const stages = [
    { label: "Cargando archivo", detail: `${fileSizeMB} MB`, done: step >= 1, active: step === 0 },
    { label: "Extracción de datos", detail: step >= 1 ? SUBMESSAGES[subMsgIdx] : "3-5 segundos estimado", done: step >= 2, active: step === 1 },
    { label: "Identificando programas", detail: "2-3 segundos estimado", done: step >= 3, active: step === 2 },
  ];

  return (
    <div style={{ maxWidth: 500, margin: "20px auto", padding: "0 16px" }}>
      {/* Animated icon + title */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, animation: "spin 1.4s linear infinite", display: "inline-block", marginBottom: 12 }}>📄</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0A2540", marginBottom: 6 }}>
          Leyendo y estructurando tu documento...
        </h3>
        <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
          Nuestro sistema está analizando el contenido de tu itinerario
        </p>
      </div>

      {/* Stage list */}
      <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
        {stages.map((s, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: s.done ? "#10B981" : s.active ? "#3B82F6" : "#E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {s.done
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : s.active
                  ? <div style={{ width: 8, height: 8, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
                  : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1" }} />
                }
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: s.done ? "#10B981" : s.active ? "#1D4ED8" : "#94A3B8", margin: 0 }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{s.detail}</p>
              </div>
              {s.done && <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>✓ Completado</span>}
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 0.4s ease",
                background: s.done ? "#10B981" : s.active ? "#3B82F6" : "#E2E8F0",
                width: s.done ? "100%" : s.active ? `${extractProgress}%` : "0%",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* File info */}
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>📎</span>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fileName}</p>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{fileSizeMB} MB · {detectedFormat}</p>
        </div>
      </div>
    </div>
  );
}
