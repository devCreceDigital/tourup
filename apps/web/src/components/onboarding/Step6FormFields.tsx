"use client";
import { useState } from "react";
import type { TripData, TripErrors } from "@/lib/onboarding/validateTrip";
import { EMPTY_TRIP, validateTripData } from "@/lib/onboarding/validateTrip";
import type { ParsedTripData } from "@/lib/onboarding/parseUserInput";

const TRIP_TYPES = ["Aventura","Playa y relajación","Cultural y patrimonio","Lujo y bienestar","Negocios","Familiar","Grupos","Otro"];
const TRAVELER_TYPES = ["Parejas","Familias","Grupos de amigos","Ejecutivos","Personas mayores","Solo viajeros","Familias con niños"];
const CURRENCIES = ["USD","EUR","COP","MXN","ARS","PEN","BRL"];
const INCLUDES_OPTIONS = ["Alojamiento","Transporte","Alimentos","Guía turístico","Seguros","Actividades","Visas/Documentación"];
const DIFFICULTY_LEVELS = ["Muy fácil","Fácil","Moderado","Desafiante","Muy desafiante"];
const ACTIVITY_SUGGESTIONS = ["Senderismo","Buceo","Gastronomía","Museos","Playas","Montañas","Ciudades","Templos","Fotografía","Meditación","Safari","Ski"];

const label: React.CSSProperties = { display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:6 };
const inp: React.CSSProperties = { width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540",boxSizing:"border-box" };
const card: React.CSSProperties = { background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:20,marginBottom:20 };
const section: React.CSSProperties = { fontSize:13,fontWeight:700,color:"#64748B",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14,paddingBottom:8,borderBottom:"1px solid #F1F5F9" };

interface Step6FormFieldsProps {
  initialData: ParsedTripData;
  onSubmit: (data: TripData) => void;
  onBack: () => void;
}

export function Step6FormFields({ initialData, onSubmit, onBack }: Step6FormFieldsProps) {
  const [data, setData] = useState<TripData>({
    ...EMPTY_TRIP,
    destinationMain: initialData.destinationMain ?? "",
    durationDays: initialData.durationDays ?? 0,
    travelerTypes: initialData.travelerTypes ?? [],
    maxCapacity: initialData.maxCapacity ?? 0,
    priceFrom: initialData.priceFrom ?? 0,
    currency: initialData.currency ?? "USD",
    activities: initialData.activities ?? [],
    startDate: initialData.startDate ?? "",
  });
  const [errors, setErrors] = useState<TripErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [actInput, setActInput] = useState("");

  function set<K extends keyof TripData>(key: K, value: TripData[K]) {
    setData(prev => {
      const next = { ...prev, [key]: value };
      if (submitted) setErrors(validateTripData(next));
      return next;
    });
  }

  function toggleList<K extends keyof TripData>(key: K, item: string) {
    const arr = (data[key] as string[]);
    set(key, (arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]) as TripData[K]);
  }

  function addActivity() {
    const trimmed = actInput.trim();
    if (!trimmed || data.activities.includes(trimmed)) return;
    set("activities", [...data.activities, trimmed]);
    setActInput("");
  }

  function err(key: keyof TripData) {
    return submitted ? errors[key] : undefined;
  }

  function handleSubmit() {
    setSubmitted(true);
    const errs = validateTripData(data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit(data);
  }

  function errBorder(key: keyof TripData) {
    return submitted && errors[key] ? "1px solid #EF4444" : "1px solid #E2E8F0";
  }

  return (
    <div style={{ maxWidth:640,margin:"0 auto",padding:"20px" }}>
      <h2 style={{ fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:6 }}>Detalles del viaje</h2>
      <p style={{ fontSize:13,color:"#64748B",marginBottom:24 }}>Completa la información para que tus clientes encuentren tu viaje.</p>

      {/* Sección 1: Información básica */}
      <div style={card}>
        <p style={section}>Información básica</p>
        <div style={{ display:"grid",gap:16 }}>
          <div>
            <label style={label}>Nombre / Título del viaje *</label>
            <input value={data.title} onChange={e => set("title", e.target.value)} placeholder="Ej: Viaje Místico a Japón — Templos y Cultura" style={{ ...inp, border:errBorder("title") }} />
            {err("title") && <p style={{ fontSize:11,color:"#EF4444",marginTop:4 }}>{err("title")}</p>}
          </div>
          <div>
            <label style={label}>Descripción del viaje *</label>
            <textarea value={data.description} onChange={e => set("description", e.target.value)} placeholder="Cuéntale a tus clientes qué los espera... sé creativo y detallado." style={{ ...inp, minHeight:110,fontFamily:"inherit",resize:"vertical",border:errBorder("description") }} />
            {err("description") && <p style={{ fontSize:11,color:"#EF4444",marginTop:4 }}>{err("description")}</p>}
          </div>
          <div>
            <label style={label}>Tipo de viaje *</label>
            <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginTop:4 }}>
              {TRIP_TYPES.map(t => {
                const on = data.type === t;
                return <button key={t} onClick={() => set("type", t)} style={{ padding:"6px 14px",borderRadius:16,border:"1px solid",fontSize:13,cursor:"pointer",borderColor:on?"#3B82F6":"#E2E8F0",background:on?"#EFF6FF":"#fff",color:on?"#1D4ED8":"#475569",fontWeight:on?600:400 }}>{t}</button>;
              })}
            </div>
            {err("type") && <p style={{ fontSize:11,color:"#EF4444",marginTop:4 }}>{err("type")}</p>}
          </div>
        </div>
      </div>

      {/* Sección 2: Itinerario */}
      <div style={card}>
        <p style={section}>Detalles del itinerario</p>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
          <div>
            <label style={label}>Duración (días) *</label>
            <input type="number" min="1" max="365" value={data.durationDays || ""} onChange={e => set("durationDays", parseInt(e.target.value) || 0)} placeholder="Ej: 14" style={{ ...inp, border:errBorder("durationDays") }} />
            {err("durationDays") && <p style={{ fontSize:11,color:"#EF4444",marginTop:4 }}>{err("durationDays")}</p>}
          </div>
          <div>
            <label style={label}>Fecha de inicio <span style={{ fontWeight:400,color:"#94A3B8" }}>(opcional)</span></label>
            <input type="date" value={data.startDate} onChange={e => set("startDate", e.target.value)} style={inp} />
          </div>
        </div>
        <div>
          <label style={label}>Destino principal *</label>
          <input value={data.destinationMain} onChange={e => set("destinationMain", e.target.value)} placeholder="Ej: Japón, Tokio — Kioto — Osaka" style={{ ...inp, border:errBorder("destinationMain") }} />
          {err("destinationMain") && <p style={{ fontSize:11,color:"#EF4444",marginTop:4 }}>{err("destinationMain")}</p>}
        </div>
      </div>

      {/* Sección 3: Viajeros */}
      <div style={card}>
        <p style={section}>Viajeros y capacidad</p>
        <div style={{ marginBottom:16 }}>
          <label style={label}>Tipo de viajeros objetivo *</label>
          <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
            {TRAVELER_TYPES.map(t => {
              const on = data.travelerTypes.includes(t);
              return <button key={t} onClick={() => toggleList("travelerTypes", t)} style={{ padding:"6px 14px",borderRadius:16,border:"1px solid",fontSize:13,cursor:"pointer",borderColor:on?"#3B82F6":"#E2E8F0",background:on?"#EFF6FF":"#fff",color:on?"#1D4ED8":"#475569",fontWeight:on?600:400 }}>{t}</button>;
            })}
          </div>
          {err("travelerTypes") && <p style={{ fontSize:11,color:"#EF4444",marginTop:4 }}>{err("travelerTypes")}</p>}
        </div>
        <div>
          <label style={label}>Capacidad máxima *</label>
          <input type="number" min="1" value={data.maxCapacity || ""} onChange={e => set("maxCapacity", parseInt(e.target.value) || 0)} placeholder="Ej: 12" style={{ ...inp, border:errBorder("maxCapacity") }} />
          {err("maxCapacity") && <p style={{ fontSize:11,color:"#EF4444",marginTop:4 }}>{err("maxCapacity")}</p>}
        </div>
      </div>

      {/* Sección 4: Precios */}
      <div style={card}>
        <p style={section}>Presupuesto y precios</p>
        <div style={{ marginBottom:16 }}>
          <label style={label}>Precio por persona (desde) *</label>
          <div style={{ display:"flex",gap:8 }}>
            <select value={data.currency} onChange={e => set("currency", e.target.value)} style={{ width:84,border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 8px",fontSize:13,color:"#0A2540",background:"#fff",cursor:"pointer" }}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min="0" value={data.priceFrom || ""} onChange={e => set("priceFrom", parseFloat(e.target.value) || 0)} placeholder="Ej: 1500" style={{ ...inp, border:errBorder("priceFrom") }} />
          </div>
          {err("priceFrom") && <p style={{ fontSize:11,color:"#EF4444",marginTop:4 }}>{err("priceFrom")}</p>}
        </div>
        <div>
          <label style={label}>Precio máximo sugerido <span style={{ fontWeight:400,color:"#94A3B8" }}>(opcional)</span></label>
          <div style={{ display:"flex",gap:8 }}>
            <div style={{ width:84,height:42,background:"#F7F8FA",borderRadius:8,border:"1px solid #E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#64748B" }}>{data.currency}</div>
            <input type="number" min="0" value={data.priceTo || ""} onChange={e => set("priceTo", parseFloat(e.target.value) || 0)} placeholder="Ej: 3000" style={inp} />
          </div>
        </div>
      </div>

      {/* Sección 5: Actividades */}
      <div style={card}>
        <p style={section}>Actividades incluidas</p>
        <div style={{ marginBottom:10 }}>
          <label style={label}>Sugerencias:</label>
          <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginBottom:12 }}>
            {ACTIVITY_SUGGESTIONS.map(a => {
              const on = data.activities.includes(a);
              return <button key={a} onClick={() => toggleList("activities", a)} style={{ padding:"5px 12px",borderRadius:14,border:"1px solid",fontSize:12,cursor:"pointer",borderColor:on?"#D946EF":"#E2E8F0",background:on?"rgba(217,70,239,0.08)":"#fff",color:on?"#D946EF":"#475569",fontWeight:on?600:400 }}>{a}</button>;
            })}
          </div>
          <label style={label}>O escribe una actividad personalizada:</label>
          <div style={{ display:"flex",gap:8 }}>
            <input value={actInput} onChange={e => setActInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&(e.preventDefault(),addActivity())} placeholder="Ej: Vuelos en globo, surf, rafting..." style={inp} />
            <button onClick={addActivity} style={{ flexShrink:0,background:"#0A2540",color:"#fff",border:"none",borderRadius:8,padding:"0 14px",fontSize:13,fontWeight:600,cursor:"pointer" }}>+</button>
          </div>
        </div>
        {data.activities.length > 0 && (
          <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginTop:10 }}>
            {data.activities.map(a => (
              <div key={a} style={{ display:"flex",alignItems:"center",gap:5,background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:14,padding:"4px 10px" }}>
                <span style={{ fontSize:12,color:"#15803D",fontWeight:500 }}>{a}</span>
                <button onClick={() => set("activities", data.activities.filter(x => x !== a))} style={{ background:"none",border:"none",cursor:"pointer",color:"#94A3B8",padding:0,lineHeight:1,fontSize:14 }}>×</button>
              </div>
            ))}
          </div>
        )}
        {err("activities") && <p style={{ fontSize:11,color:"#EF4444",marginTop:6 }}>{err("activities")}</p>}
      </div>

      {/* Sección 6: Requisitos */}
      <div style={card}>
        <p style={section}>Requisitos y consideraciones</p>
        <div style={{ marginBottom:16 }}>
          <label style={label}>¿Qué se incluye en el viaje?</label>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
            {INCLUDES_OPTIONS.map(opt => {
              const on = data.includes.includes(opt);
              return (
                <button key={opt} onClick={() => toggleList("includes", opt)} style={{ display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:"4px 0",textAlign:"left" }}>
                  <div style={{ width:16,height:16,borderRadius:4,border:`1.5px solid ${on?"#0A2540":"#CBD5E1"}`,background:on?"#0A2540":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    {on && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize:13,color:on?"#0A2540":"#64748B",fontWeight:on?500:400 }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={label}>Nivel de dificultad <span style={{ fontWeight:400,color:"#94A3B8" }}>(opcional)</span></label>
          <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
            {DIFFICULTY_LEVELS.map(d => {
              const on = data.difficultyLevel === d;
              return <button key={d} onClick={() => set("difficultyLevel", on?"":d)} style={{ padding:"5px 12px",borderRadius:14,border:"1px solid",fontSize:12,cursor:"pointer",borderColor:on?"#0A2540":"#E2E8F0",background:on?"#0A2540":"#fff",color:on?"#fff":"#475569",fontWeight:on?600:400 }}>{d}</button>;
            })}
          </div>
        </div>
        <div>
          <label style={label}>Notas especiales <span style={{ fontWeight:400,color:"#94A3B8" }}>(opcional)</span></label>
          <textarea value={data.specialNotes} onChange={e => set("specialNotes", e.target.value)} placeholder="Requisitos de salud, recomendaciones, restricciones..." style={{ ...inp, minHeight:90,fontFamily:"inherit",resize:"vertical" }} />
        </div>
      </div>

      <div style={{ display:"flex",gap:10,marginTop:4 }}>
        <button onClick={handleSubmit} style={{ flex:1,background:"#3B82F6",color:"#fff",border:"none",borderRadius:10,padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(59,130,246,0.3)" }}>
          Confirmar detalles →
        </button>
        <button onClick={onBack} style={{ flex:"0 0 auto",background:"#fff",color:"#0A2540",border:"1px solid #E2E8F0",borderRadius:10,padding:"15px 18px",fontSize:14,cursor:"pointer",fontWeight:500 }}>
          ← Volver
        </button>
      </div>
    </div>
  );
}
