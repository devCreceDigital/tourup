"use client";
import { useState } from "react";
import type { ParsedTripData } from "@/lib/onboarding/parseUserInput";

interface Step6DataDetectedProps {
  data: ParsedTripData;
  onConfirm: (data: ParsedTripData) => void;
  onEdit: (data: ParsedTripData) => void;
}

const TRAVELER_TYPES = ["Parejas","Familias","Grupos de amigos","Ejecutivos","Personas mayores","Solo viajeros","Familias con niños"];

export function Step6DataDetected({ data, onConfirm, onEdit }: Step6DataDetectedProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ParsedTripData>(data);
  const [showBudget, setShowBudget] = useState(!!data.priceFrom);

  function toggleTravelerType(t: string) {
    setDraft(prev => {
      const cur = prev.travelerTypes ?? [];
      return { ...prev, travelerTypes: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] };
    });
  }

  const rows = [
    { label:"DESTINO",          value:data.destinationMain, icon:"🌍" },
    { label:"DURACIÓN",         value:data.durationDays ? `${data.durationDays} días` : undefined, icon:"📅" },
    { label:"TIPO DE VIAJEROS", value:data.travelerTypes?.join(", "), icon:"👥" },
    { label:"CANTIDAD",         value:data.maxCapacity ? `${data.maxCapacity} persona${data.maxCapacity>1?"s":""}` : undefined, icon:"🧑‍🤝‍🧑" },
    ...(data.activities?.length ? [{ label:"ACTIVIDADES", value:data.activities.join(", "), icon:"🎯" }] : []),
  ].filter(r => r.value);

  const hasData = rows.length > 0;

  return (
    <div style={{ maxWidth:640,margin:"20px auto" }}>
      {/* Card detected data */}
      <div style={{ background:"#fff",border:"2px solid #DBEAFE",borderRadius:14,overflow:"hidden",marginBottom:16,boxShadow:"0 2px 8px rgba(59,130,246,0.08)" }}>
        <div style={{ background:"#EFF6FF",padding:"12px 18px",display:"flex",alignItems:"center",gap:8,borderBottom:"1px solid #DBEAFE" }}>
          <span style={{ fontSize:16 }}>📋</span>
          <span style={{ fontSize:14,fontWeight:700,color:"#1E40AF" }}>Datos Detectados</span>
          {hasData && <span style={{ marginLeft:"auto",fontSize:11,color:"#3B82F6",fontWeight:500 }}>{rows.length} campo{rows.length>1?"s":""} encontrado{rows.length>1?"s":""}</span>}
        </div>

        {!editing ? (
          <div style={{ padding:18 }}>
            {hasData ? (
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                {rows.map((r, i) => (
                  <div key={i} style={{ background:"#F8FAFF",borderRadius:8,padding:"10px 14px" }}>
                    <div style={{ fontSize:10,fontWeight:700,color:"#64748B",letterSpacing:"0.06em",marginBottom:4 }}>{r.label}</div>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ fontSize:16 }}>{r.icon}</span>
                      <span style={{ fontSize:14,fontWeight:500,color:"#0A2540" }}>{r.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:13,color:"#64748B",textAlign:"center",padding:"12px 0" }}>No detecté información específica. Completa el formulario manualmente.</p>
            )}
          </div>
        ) : (
          <div style={{ padding:18,display:"grid",gap:14 }}>
            <div>
              <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#64748B",marginBottom:6 }}>🌍 Destino</label>
              <input value={draft.destinationMain ?? ""} onChange={e => setDraft(p => ({...p,destinationMain:e.target.value}))} style={{ width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#0A2540",boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              <div>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#64748B",marginBottom:6 }}>📅 Duración (días)</label>
                <input type="number" min="1" max="365" value={draft.durationDays ?? ""} onChange={e => setDraft(p => ({...p,durationDays:parseInt(e.target.value)||undefined}))} style={{ width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#0A2540",boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#64748B",marginBottom:6 }}>🧑‍🤝‍🧑 Cantidad viajeros</label>
                <input type="number" min="1" value={draft.maxCapacity ?? ""} onChange={e => setDraft(p => ({...p,maxCapacity:parseInt(e.target.value)||undefined}))} style={{ width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#0A2540",boxSizing:"border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#64748B",marginBottom:8 }}>👥 Tipo de viajeros</label>
              <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
                {TRAVELER_TYPES.map(t => {
                  const on = draft.travelerTypes?.includes(t) ?? false;
                  return (
                    <button key={t} onClick={() => toggleTravelerType(t)} style={{ padding:"5px 12px",borderRadius:14,border:"1px solid",fontSize:12,cursor:"pointer",borderColor:on?"#3B82F6":"#E2E8F0",background:on?"#EFF6FF":"#fff",color:on?"#1D4ED8":"#475569",fontWeight:on?600:400 }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={() => { setDraft(data); setEditing(false); }} style={{ width:"100%",background:"#0A2540",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer" }}>
              Guardar cambios
            </button>
          </div>
        )}
      </div>

      {/* Añadir presupuesto */}
      {!showBudget ? (
        <button onClick={() => setShowBudget(true)} style={{ background:"none",border:"none",fontSize:13,color:"#3B82F6",cursor:"pointer",padding:"0 0 12px",display:"block",textDecoration:"underline" }}>
          + Añadir presupuesto aproximado
        </button>
      ) : (
        <div style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,padding:14,marginBottom:12,display:"flex",gap:10,alignItems:"center" }}>
          <span style={{ fontSize:14 }}>💵</span>
          <select value={draft.currency ?? "USD"} onChange={e => setDraft(p => ({...p,currency:e.target.value}))} style={{ border:"1px solid #E2E8F0",borderRadius:6,padding:"7px 10px",fontSize:13,color:"#0A2540",background:"#fff",cursor:"pointer" }}>
            {["USD","EUR","COP","MXN","ARS","PEN"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" min="0" value={draft.priceFrom ?? ""} onChange={e => setDraft(p => ({...p,priceFrom:parseFloat(e.target.value)||undefined}))} placeholder="Presupuesto por persona" style={{ flex:1,border:"1px solid #E2E8F0",borderRadius:6,padding:"7px 10px",fontSize:13,color:"#0A2540" }} />
          <button onClick={() => setShowBudget(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"#94A3B8",padding:4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Botones */}
      <div style={{ display:"flex",gap:10 }}>
        <button
          onClick={() => { if (editing) { setEditing(false); onConfirm(draft); } else onConfirm(draft); }}
          style={{ flex:1,background:"#3B82F6",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 16px rgba(59,130,246,0.3)" }}
        >
          ✓ Confirmar datos
        </button>
        {!editing && (
          <button
            onClick={() => { setDraft(data); setEditing(true); }}
            style={{ flex:"0 0 auto",background:"#fff",color:"#0A2540",border:"1px solid #E2E8F0",borderRadius:10,padding:"13px 18px",fontSize:14,cursor:"pointer",fontWeight:500 }}
          >
            ✏️ Editar
          </button>
        )}
      </div>
    </div>
  );
}
