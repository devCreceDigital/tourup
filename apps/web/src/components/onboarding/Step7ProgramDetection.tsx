"use client";
import { useState } from "react";
import type { ExtractedProgram } from "@/lib/documents/types";

interface Step7ProgramDetectionProps {
  programs: ExtractedProgram[];
  fileName: string;
  onContinue: (selected: ExtractedProgram[]) => void;
  onUploadNew: () => void;
}

const TRIP_TYPES = ["Aventura", "Playa y relajación", "Cultural y patrimonio", "Lujo y bienestar", "Negocios", "Familiar", "Grupos", "Otro"];
const TRAVELER_TYPES = ["Parejas", "Familias", "Grupos de amigos", "Ejecutivos", "Personas mayores", "Solo viajeros", "Familias con niños"];
const ACTIVITIES_LIST = ["Senderismo", "Buceo", "Gastronomía", "Museos", "Playas", "Montañas", "Ciudades", "Templos", "Fotografía", "Meditación", "Kayak", "Camping", "Pesca", "Spa", "Yoga", "Cultura", "Naturaleza"];
const INCLUDES_LIST = ["Transporte", "Alojamiento", "Alimentos", "Guía turístico", "Entradas", "Seguros"];

function ConfidenceBadge({ score }: { score: number }) {
  const high = score >= 70;
  const med = score >= 50 && score < 70;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
      background: high ? "#ECFDF5" : med ? "#FFFBEB" : "#FEF2F2",
      color: high ? "#065F46" : med ? "#92400E" : "#991B1B",
    }}>
      {high ? "✅" : "⚠️"} {score}% confiabilidad
    </span>
  );
}

function EditModal({ program, onSave, onClose }: {
  program: ExtractedProgram;
  onSave: (p: ExtractedProgram) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ExtractedProgram>({ ...program });
  const [actInput, setActInput] = useState("");

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0A2540", boxSizing: "border-box", fontFamily: "inherit" };

  function toggleActivity(a: string) {
    setDraft(p => ({ ...p, activities: p.activities.includes(a) ? p.activities.filter(x => x !== a) : [...p.activities, a] }));
  }
  function toggleInclude(inc: string) {
    setDraft(p => ({ ...p, includes: p.includes.includes(inc) ? p.includes.filter(x => x !== inc) : [...p.includes, inc] }));
  }
  function addActivityFromInput() {
    const val = actInput.trim();
    if (val && !draft.activities.includes(val)) setDraft(p => ({ ...p, activities: [...p.activities, val] }));
    setActInput("");
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 12px 48px rgba(0,0,0,0.22)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A2540", margin: 0 }}>Editar programa</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Título *</label>
            <input style={inp} value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} placeholder="Nombre del programa" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Descripción *</label>
            <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} placeholder="Describe el programa..." />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Destino *</label>
            <input style={inp} value={draft.destination} onChange={e => setDraft(p => ({ ...p, destination: e.target.value }))} placeholder="Ej: Cusco, Perú" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Fecha inicio</label>
              <input type="date" style={inp} value={draft.dateStart} onChange={e => setDraft(p => ({ ...p, dateStart: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Fecha fin</label>
              <input type="date" style={inp} value={draft.dateEnd} onChange={e => setDraft(p => ({ ...p, dateEnd: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Duración (días)</label>
              <input type="number" min="0" max="365" style={inp} value={draft.durationDays || ""} onChange={e => setDraft(p => ({ ...p, durationDays: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Capacidad máx.</label>
              <input type="number" min="0" style={inp} value={draft.maxCapacity || ""} onChange={e => setDraft(p => ({ ...p, maxCapacity: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Precio desde *</label>
              <input type="number" min="0" style={inp} value={draft.priceFrom || ""} onChange={e => setDraft(p => ({ ...p, priceFrom: parseFloat(e.target.value) || 0 }))} placeholder="1500" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Precio hasta</label>
              <input type="number" min="0" style={inp} value={draft.priceTo || ""} onChange={e => setDraft(p => ({ ...p, priceTo: parseFloat(e.target.value) || 0 }))} placeholder="2000" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Moneda</label>
              <select style={{ ...inp, cursor: "pointer" }} value={draft.currency} onChange={e => setDraft(p => ({ ...p, currency: e.target.value }))}>
                {["USD", "EUR", "COP", "MXN", "ARS", "PEN", "BRL"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Tipo de viaje</label>
            <select style={{ ...inp, cursor: "pointer" }} value={draft.type} onChange={e => setDraft(p => ({ ...p, type: e.target.value }))}>
              {TRIP_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 8 }}>Actividades</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {ACTIVITIES_LIST.map(a => (
                <button key={a} onClick={() => toggleActivity(a)} style={{ padding: "4px 10px", borderRadius: 12, border: "1px solid", fontSize: 11, cursor: "pointer", borderColor: draft.activities.includes(a) ? "#3B82F6" : "#E2E8F0", background: draft.activities.includes(a) ? "#EFF6FF" : "#fff", color: draft.activities.includes(a) ? "#1D4ED8" : "#475569", fontWeight: draft.activities.includes(a) ? 600 : 400 }}>
                  {a}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input style={{ ...inp, flex: 1 }} value={actInput} onChange={e => setActInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addActivityFromInput()} placeholder="Escribe y presiona Enter..." />
              <button onClick={addActivityFromInput} style={{ padding: "9px 14px", background: "#EFF6FF", border: "1px solid #DBEAFE", borderRadius: 8, color: "#3B82F6", fontSize: 13, cursor: "pointer" }}>+</button>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 8 }}>Incluye</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {INCLUDES_LIST.map(inc => (
                <label key={inc} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0A2540", cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.includes.includes(inc)} onChange={() => toggleInclude(inc)} style={{ width: 14, height: 14, cursor: "pointer" }} />
                  {inc}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Tipo de viajeros</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TRAVELER_TYPES.map(t => (
                <button key={t} onClick={() => setDraft(p => ({ ...p, travelerTypes: p.travelerTypes.includes(t) ? p.travelerTypes.filter(x => x !== t) : [...p.travelerTypes, t] }))}
                  style={{ padding: "4px 10px", borderRadius: 12, border: "1px solid", fontSize: 11, cursor: "pointer", borderColor: draft.travelerTypes.includes(t) ? "#D946EF" : "#E2E8F0", background: draft.travelerTypes.includes(t) ? "rgba(217,70,239,0.08)" : "#fff", color: draft.travelerTypes.includes(t) ? "#D946EF" : "#475569", fontWeight: draft.travelerTypes.includes(t) ? 600 : 400 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={() => onSave(draft)} style={{ flex: 1, background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Guardar cambios
          </button>
          <button onClick={onClose} style={{ flex: "0 0 auto", background: "#fff", color: "#0A2540", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 20px", fontSize: 14, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function Step7ProgramDetection({ programs, fileName, onContinue, onUploadNew }: Step7ProgramDetectionProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set(programs.map(p => p.id)));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localPrograms, setLocalPrograms] = useState<ExtractedProgram[]>(programs);

  function toggle(id: string) {
    setChecked(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function handleSave(updated: ExtractedProgram) {
    setLocalPrograms(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingId(null);
  }

  const editingProgram = editingId ? localPrograms.find(p => p.id === editingId) : null;
  const selected = localPrograms.filter(p => checked.has(p.id));

  return (
    <div style={{ maxWidth: 640, margin: "20px auto" }}>
      {/* Info badge */}
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#1E40AF", marginBottom: 4 }}>PASO 2 DE 5 — ANÁLISIS COMPLETADO</p>
          <p style={{ fontSize: 13, color: "#1E40AF", margin: 0 }}>
            Detecté <strong>{localPrograms.length} programas</strong> en <em>{fileName}</em>. Selecciona los que deseas incluir y edita si necesitas ajustar algún dato.
          </p>
        </div>
      </div>

      {/* Bulk actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setChecked(new Set(localPrograms.map(p => p.id)))}
          style={{ padding: "7px 14px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#0A2540" }}>
          Seleccionar todos
        </button>
        <button onClick={() => setChecked(new Set())}
          style={{ padding: "7px 14px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#0A2540" }}>
          Deseleccionar todos
        </button>
        <button onClick={onUploadNew}
          style={{ padding: "7px 14px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#64748B", marginLeft: "auto" }}>
          📤 Subir otro archivo
        </button>
      </div>

      {/* Program cards */}
      <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
        {localPrograms.map(program => {
          const isChecked = checked.has(program.id);
          return (
            <div key={program.id}
              style={{ background: "#fff", border: `1px solid ${isChecked ? "#BFDBFE" : "#E2E8F0"}`, borderLeft: `4px solid ${program.confidence >= 70 ? "#D946EF" : program.confidence >= 50 ? "#F59E0B" : "#EF4444"}`, borderRadius: "0 10px 10px 0", padding: 20, opacity: isChecked ? 1 : 0.55, transition: "all 0.15s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <input type="checkbox" checked={isChecked} onChange={() => toggle(program.id)}
                  style={{ width: 16, height: 16, marginTop: 2, cursor: "pointer", accentColor: "#3B82F6", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#0A2540" }}>{program.title}</span>
                      <ConfidenceBadge score={program.confidence} />
                    </div>
                    <button onClick={() => setEditingId(program.id)}
                      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#475569", whiteSpace: "nowrap" }}>
                      ✏️ Editar
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748B", marginBottom: 10, lineHeight: 1.5 }}>{program.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {program.destination && <span style={{ fontSize: 12, color: "#475569" }}>🌍 {program.destination}</span>}
                    {program.durationDays > 0 && <span style={{ fontSize: 12, color: "#475569" }}>⏱️ {program.durationDays} día{program.durationDays > 1 ? "s" : ""}</span>}
                    {(program.dateStart) && <span style={{ fontSize: 12, color: "#475569" }}>📅 {program.dateStart}{program.dateEnd ? ` → ${program.dateEnd}` : ""}</span>}
                    {program.priceFrom > 0 && <span style={{ fontSize: 12, color: "#475569" }}>💵 {program.currency} {program.priceFrom.toLocaleString()}{program.priceTo ? `–${program.priceTo.toLocaleString()}` : ""}</span>}
                  </div>
                  {program.warnings.length > 0 && (
                    <div style={{ marginTop: 10, background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#92400E" }}>
                      ⚠️ {program.warnings.join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue button */}
      <button
        onClick={() => onContinue(selected)}
        disabled={selected.length === 0}
        style={{ width: "100%", background: selected.length > 0 ? "#3B82F6" : "#EEF2F7", color: selected.length > 0 ? "#fff" : "#94A3B8", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 600, cursor: selected.length > 0 ? "pointer" : "default", boxShadow: selected.length > 0 ? "0 4px 16px rgba(59,130,246,0.3)" : "none", transition: "all 0.15s" }}
      >
        Continuar con {selected.length} seleccionado{selected.length !== 1 ? "s" : ""} →
      </button>
      {selected.length === 0 && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 6 }}>Selecciona al menos un programa para continuar</p>
      )}

      {/* Edit modal */}
      {editingProgram && (
        <EditModal program={editingProgram} onSave={handleSave} onClose={() => setEditingId(null)} />
      )}
    </div>
  );
}
