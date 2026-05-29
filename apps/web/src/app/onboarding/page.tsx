"use client";
import { useState, useEffect, useRef } from "react";

type Message = { id: string; role: "ai" | "user"; content: string; chips: string[] };

interface CompanyData {
  nombre: string; slogan: string; descripcion: string;
  mision: string; vision: string; email: string; telefono: string;
}

interface TripData {
  titulo: string; destino: string; descripcion: string; tipo: string;
  duracion: string; precio: string; moneda: string; capacidad: string; fechaSalida: string;
}

const TIPOS = ["Agencia Minorista", "Operador Mayorista", "DMC / Local", "Guia Independiente", "Agencia Online", "Otro"];
const TRIP_TIPOS = ["Aventura", "Cultural", "Playa y Sol", "Naturaleza", "Ciudad", "Crucero", "Otro"];
const MONEDAS = ["USD", "EUR", "COP", "MXN", "ARS"];

const TOOLS = [
  { id: "gmail",     label: "Gmail" },
  { id: "calendar",  label: "Google Calendar" },
  { id: "outlook",   label: "Outlook" },
  { id: "hubspot",   label: "HubSpot for WordPress" },
  { id: "linkedin",  label: "LinkedIn Sales Navigator" },
  { id: "salesforce",label: "Salesforce" },
  { id: "slack",     label: "Slack" },
  { id: "whatsapp",  label: "WhatsApp Business" },
] as const;

const WORKSPACE_CARDS = [
  {
    id: "contactos", title: "Contactos",
    iconPath: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    fields: ["Fecha de última interacción","Área de especialización","Nivel de influencia","Preferencia de comunicación"],
  },
  {
    id: "empresas", title: "Empresas",
    iconPath: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    fields: ["Industria principal","Tipo de cliente","Número de empleados","Fecha de fundación"],
  },
  {
    id: "negocios", title: "Negocios",
    iconPath: "M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5",
    fields: ["Duración estimada del proyecto","Tipo de servicio ofrecido","Fecha estimada de finalización","Fecha de inicio del proyecto"],
  },
  {
    id: "tickets", title: "Tickets",
    iconPath: "M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 1 2-2z",
    fields: ["Fecha de creación del ticket","Categoría del problema","Método de reporte","Prioridad del ticket"],
  },
] as const;

/*
  Fases internas → Paso visual:
  0           → Paso 1 (bienvenida)
  1           → Paso 1 (tipo de agencia)
  2           → Paso 2 (formulario empresa)
  3           → Paso 3 (revisión empresa)
  4           → Paso 4 (selector de herramientas)
  5           → Paso 4 (workspace config)
  6           → Paso 5 (crear viaje)
  7           → Paso 6 (éxito)
*/

function getDisplayStep(phase: number): number {
  if (phase <= 1) return 1;
  if (phase === 2) return 2;
  if (phase === 3) return 3;
  if (phase <= 5) return 4;
  if (phase === 6) return 5;
  return 6;
}

// Thresholds para 6 barras: cada barra se llena al alcanzar su fase mínima
const BAR_THRESHOLDS = [1, 2, 3, 4, 6, 7] as const;

function uid() { return Math.random().toString(36).slice(2, 9); }

function AIAvatar() {
  return <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#0A2540,#1a3a5c)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(10,37,64,0.3)"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16EFFF" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5" /></svg></div>;
}

function Chip({ label, onClick, primary, magenta }: { label: string; onClick: () => void; primary?: boolean; magenta?: boolean }) {
  if (magenta) return <button onClick={onClick} style={{background:"#D946EF",border:"none",borderRadius:14,padding:"14px 40px",fontSize:15,color:"#fff",cursor:"pointer",fontWeight:600,boxShadow:"0 4px 24px rgba(217,70,239,0.25)"}}>{label}</button>;
  if (primary) return <button onClick={onClick} style={{background:"#0A2540",border:"none",borderRadius:14,padding:"14px 40px",fontSize:15,color:"#fff",cursor:"pointer",fontWeight:600,boxShadow:"0 4px 24px rgba(10,37,64,0.18)"}}>{label}</button>;
  return <button onClick={onClick} style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:20,padding:"8px 18px",fontSize:13,color:"#0A2540",cursor:"pointer"}}>{label}</button>;
}

const inputStyle: React.CSSProperties = {width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540",boxSizing:"border-box"};
const fieldStyle: React.CSSProperties = {background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16};
const labelStyle: React.CSSProperties = {display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8};

// ─── Validación empresa ────────────────────────────────────────────────────────

const COMPANY_MAX: Partial<Record<keyof CompanyData, number>> = {
  nombre: 100, slogan: 150, descripcion: 500, mision: 500, vision: 500,
};

function validateCompany(c: CompanyData): Partial<Record<keyof CompanyData, string>> {
  const e: Partial<Record<keyof CompanyData, string>> = {};
  const n = (s: string) => s.trim().length;
  if (n(c.nombre) < 3) e.nombre = "Mínimo 3 caracteres";
  else if (n(c.nombre) > 100) e.nombre = "Máximo 100 caracteres";
  if (n(c.slogan) < 5) e.slogan = "Mínimo 5 caracteres";
  else if (n(c.slogan) > 150) e.slogan = "Máximo 150 caracteres";
  if (n(c.descripcion) < 10) e.descripcion = "Mínimo 10 caracteres";
  else if (n(c.descripcion) > 500) e.descripcion = "Máximo 500 caracteres";
  if (n(c.mision) < 10) e.mision = "Mínimo 10 caracteres";
  else if (n(c.mision) > 500) e.mision = "Máximo 500 caracteres";
  if (n(c.vision) < 10) e.vision = "Mínimo 10 caracteres";
  else if (n(c.vision) > 500) e.vision = "Máximo 500 caracteres";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = "Email inválido";
  if (!/^\d{7,15}$/.test(c.telefono.replace(/[\s\-\+\(\)]/g, ""))) e.telefono = "Entre 7 y 15 dígitos";
  return e;
}

function validateTrip(t: TripData): string[] {
  const e: string[] = [];
  if (t.titulo.trim().length < 5) e.push("Titulo debe tener al menos 5 caracteres");
  if (t.destino.trim().length < 3) e.push("Destino debe tener al menos 3 caracteres");
  if (t.descripcion.trim().length < 20) e.push("Descripcion debe tener al menos 20 caracteres");
  if (!t.tipo) e.push("Selecciona un tipo de viaje");
  const dur = parseInt(t.duracion);
  if (isNaN(dur) || dur < 1 || dur > 365) e.push("Duracion debe ser entre 1 y 365 dias");
  const precio = parseFloat(t.precio);
  if (isNaN(precio) || precio <= 0) e.push("Precio debe ser mayor a 0");
  const cap = parseInt(t.capacidad);
  if (isNaN(cap) || cap < 1 || cap > 500) e.push("Capacidad debe ser entre 1 y 500 personas");
  if (!t.fechaSalida) {
    e.push("Fecha de salida es requerida");
  } else {
    const fecha = new Date(t.fechaSalida);
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    if (fecha < hoy) e.push("Fecha de salida debe ser hoy o en el futuro");
  }
  return e;
}

// ─── Formulario empresa ────────────────────────────────────────────────────────

const EMPTY_COMPANY: CompanyData = {nombre:"",slogan:"",descripcion:"",mision:"",vision:"",email:"",telefono:""};
const EMPTY_TRIP: TripData = {titulo:"",destino:"",descripcion:"",tipo:"",duracion:"",precio:"",moneda:"USD",capacidad:"",fechaSalida:""};

type CompanyField = { key: keyof CompanyData; label: string; type: "input" | "textarea" };
const COMPANY_FIELDS: CompanyField[] = [
  {key:"nombre",label:"Nombre de la Agencia",type:"input"},
  {key:"slogan",label:"Slogan",type:"input"},
  {key:"descripcion",label:"Descripcion",type:"textarea"},
  {key:"mision",label:"Mision",type:"textarea"},
  {key:"vision",label:"Vision",type:"textarea"},
  {key:"email",label:"Email",type:"input"},
  {key:"telefono",label:"Telefono",type:"input"},
];

function CompanyForm({ onSubmit, initialData }: { onSubmit: (d: CompanyData) => void; initialData: CompanyData | null }) {
  const [c, setC] = useState<CompanyData>(initialData ?? EMPTY_COMPANY);
  const [touched, setTouched] = useState<Set<keyof CompanyData>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const errors = validateCompany(c);
  const hasErrors = Object.keys(errors).length > 0;
  const touch = (key: keyof CompanyData) => setTouched(prev => { const s = new Set(prev); s.add(key); return s; });
  const fieldError = (key: keyof CompanyData) => (touched.has(key) || submitted) ? errors[key] : undefined;

  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"20px"}}>
      <h2 style={{fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:20}}>Informacion de tu Agencia</h2>
      <div style={{display:"grid",gap:16}}>
        {COMPANY_FIELDS.map(({key,label,type})=>{
          const err = fieldError(key);
          const max = COMPANY_MAX[key];
          const len = c[key].length;
          return (
            <div key={key} style={fieldStyle}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <label style={{...labelStyle,marginBottom:0}}>{label}</label>
                {max && len > 0 && (
                  <span style={{fontSize:11,color:len>max?"#EF4444":len>max*0.85?"#F59E0B":"#94A3B8"}}>{len}/{max}</span>
                )}
              </div>
              {type==="textarea"
                ? <textarea value={c[key]} onChange={e=>setC({...c,[key]:e.target.value})} onBlur={()=>touch(key)} maxLength={max} style={{...inputStyle,minHeight:80,fontFamily:"inherit",resize:"vertical",borderColor:err?"#EF4444":"#E2E8F0",marginTop:8}} />
                : <input
                    type={key==="email"?"email":key==="telefono"?"tel":"text"}
                    value={c[key]}
                    onChange={e=>{
                      let v = e.target.value;
                      if (key==="telefono") v = v.replace(/[^\d\s\-\+\(\)]/g,"");
                      if (max && v.length > max) return;
                      setC({...c,[key]:v});
                    }}
                    onBlur={()=>touch(key)}
                    style={{...inputStyle,borderColor:err?"#EF4444":"#E2E8F0",marginTop:8}}
                  />
              }
              {err && <p style={{fontSize:11,color:"#EF4444",marginTop:5,marginBottom:0}}>{err}</p>}
            </div>
          );
        })}
      </div>
      <button
        onClick={()=>{ setSubmitted(true); if(!hasErrors) onSubmit(c); }}
        disabled={submitted && hasErrors}
        style={{width:"100%",marginTop:24,background:submitted&&hasErrors?"#EEF2F7":"#0A2540",color:submitted&&hasErrors?"#94A3B8":"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:submitted&&hasErrors?"default":"pointer"}}
      >
        Confirmar Agencia
      </button>
    </div>
  );
}

// ─── Paso 4a: Selector de herramientas ────────────────────────────────────────

function ToolSelectionForm({ onSubmit, initialSelected }: {
  onSubmit: (tools: string[], incomplete: boolean) => void;
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"20px"}}>
      <h2 style={{fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:6}}>Herramientas que usas</h2>
      <p style={{fontSize:13,color:"#64748B",marginBottom:20}}>Selecciona las herramientas que ya utilizas en tu agencia.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {TOOLS.map(tool => {
          const isOn = selected.includes(tool.id);
          return (
            <button
              key={tool.id}
              onClick={()=>toggle(tool.id)}
              style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:`1px solid ${isOn?"#0A2540":"#E2E8F0"}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"border-color 0.15s"}}
            >
              <div style={{width:20,height:20,borderRadius:5,flexShrink:0,border:`2px solid ${isOn?"#0A2540":"#CBD5E1"}`,background:isOn?"#0A2540":"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s"}}>
                {isOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
              <span style={{fontSize:13,color:"#0A2540",fontWeight:500}}>{tool.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button
          onClick={()=>onSubmit(selected, false)}
          style={{width:"100%",background:"#D946EF",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 20px rgba(217,70,239,0.25)"}}
        >
          Terminar de seleccionar mis herramientas
        </button>
        <button
          onClick={()=>onSubmit(selected, true)}
          style={{width:"100%",background:"#fff",color:"#64748B",border:"1px solid #CBD5E1",borderRadius:10,padding:"12px",fontSize:14,cursor:"pointer"}}
        >
          Me falta algunas herramientas
        </button>
      </div>
    </div>
  );
}

// ─── Paso 4b: Configuración del workspace ─────────────────────────────────────

function WorkspaceConfigForm({ onConfirm, onBack }: { onConfirm: () => void; onBack: () => void }) {
  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"20px"}}>
      <h2 style={{fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:6}}>Tu espacio de trabajo</h2>
      <p style={{fontSize:13,color:"#64748B",marginBottom:20}}>Estos son los campos que tendrás disponibles para gestionar tu negocio.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
        {WORKSPACE_CARDS.map(card => (
          <div key={card.id} style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:8,background:"#EEF2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2">
                  <path d={card.iconPath} />
                </svg>
              </div>
              <span style={{fontSize:14,fontWeight:600,color:"#0A2540"}}>{card.title}</span>
            </div>
            <div style={{display:"grid",gap:7}}>
              {card.fields.map(f => (
                <div key={f} style={{display:"flex",alignItems:"flex-start",gap:7}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#CBD5E1",flexShrink:0,marginTop:5}} />
                  <span style={{fontSize:12,color:"#64748B",lineHeight:1.4}}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button
          onClick={onConfirm}
          style={{width:"100%",background:"#D946EF",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 20px rgba(217,70,239,0.25)"}}
        >
          Sí, pasemos a conectar
        </button>
        <button
          onClick={onBack}
          style={{width:"100%",background:"#fff",color:"#64748B",border:"1px solid #CBD5E1",borderRadius:10,padding:"12px",fontSize:14,cursor:"pointer"}}
        >
          Me gustaría hacer cambios
        </button>
      </div>
    </div>
  );
}

// ─── Paso 5: Formulario de viaje ──────────────────────────────────────────────

function TripForm({ onSubmit, onSkip }: { onSubmit: (d: TripData) => void; onSkip: () => void }) {
  const today = new Date().toISOString().split("T")[0] ?? "";
  const [t, setT] = useState<TripData>(EMPTY_TRIP);
  const errors = validateTrip(t);
  const set = (k: keyof TripData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setT(prev=>({...prev,[k]:e.target.value}));
  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontSize:18,fontWeight:600,color:"#0A2540",margin:0}}>Tu Primer Viaje</h2>
        <button onClick={onSkip} style={{background:"none",border:"none",fontSize:13,color:"#64748B",cursor:"pointer",textDecoration:"underline"}}>Omitir por ahora</button>
      </div>
      <div style={{display:"grid",gap:16}}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Nombre del Viaje</label>
          <input value={t.titulo} onChange={set("titulo")} placeholder="Ej: Circuito Peru - Machu Picchu 8 dias" style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Destino Principal</label>
          <input value={t.destino} onChange={set("destino")} placeholder="Ej: Cusco, Peru" style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Tipo de Viaje</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:4}}>
            {TRIP_TIPOS.map(tipo=>(
              <button key={tipo} onClick={()=>setT(prev=>({...prev,tipo}))} style={{padding:"6px 14px",borderRadius:20,border:"1px solid",borderColor:t.tipo===tipo?"#0A2540":"#E2E8F0",background:t.tipo===tipo?"#0A2540":"#fff",color:t.tipo===tipo?"#fff":"#0A2540",fontSize:13,cursor:"pointer",fontWeight:t.tipo===tipo?600:400}}>
                {tipo}
              </button>
            ))}
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Descripcion del Viaje</label>
          <textarea value={t.descripcion} onChange={set("descripcion")} placeholder="Describe la experiencia, que incluye, por que es especial..." style={{...inputStyle,minHeight:100,fontFamily:"inherit",resize:"vertical"}} />
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Duracion (dias)</label>
            <input type="number" min="1" max="365" value={t.duracion} onChange={set("duracion")} placeholder="Ej: 8" style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Capacidad maxima</label>
            <input type="number" min="1" max="500" value={t.capacidad} onChange={set("capacidad")} placeholder="Ej: 15" style={inputStyle} />
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Precio por persona</label>
            <input type="number" min="0" step="0.01" value={t.precio} onChange={set("precio")} placeholder="Ej: 1250" style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Moneda</label>
            <select value={t.moneda} onChange={set("moneda")} style={{...inputStyle,cursor:"pointer"}}>
              {MONEDAS.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Fecha de Salida</label>
          <input type="date" min={today} value={t.fechaSalida} onChange={set("fechaSalida")} style={inputStyle} />
        </div>
      </div>
      <button onClick={()=>{ const e=validateTrip(t); if(e.length>0){alert("Completa los campos:\n"+e.join("\n"));}else{onSubmit(t);}}} disabled={errors.length>0} style={{width:"100%",marginTop:24,background:errors.length>0?"#EEF2F7":"#D946EF",color:errors.length>0?"#94A3B8":"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:errors.length>0?"default":"pointer"}}>
        Publicar Viaje
      </button>
    </div>
  );
}

// ─── Pantalla de éxito ────────────────────────────────────────────────────────

function CheckIcon() {
  return <div style={{width:20,height:20,borderRadius:"50%",background:"#16EFFF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
  </div>;
}

function SuccessScreen({ companyData, tripData }: { companyData: CompanyData; tripData: TripData | null }) {
  const fechaFormateada = tripData?.fechaSalida
    ? new Date(tripData.fechaSalida + "T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})
    : "";
  return (
    <div style={{maxWidth:640,margin:"20px auto",padding:"0 16px"}}>
      <div style={{background:"linear-gradient(135deg,#0A2540,#1a3a5c)",borderRadius:16,padding:32,textAlign:"center",marginBottom:24}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(22,239,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16EFFF" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h2 style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:8}}>Todo listo, {companyData.nombre.split(" ")[0]}!</h2>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.7)",lineHeight:1.6}}>Tu cuenta esta configurada y lista para recibir clientes.</p>
      </div>
      <div style={{display:"grid",gap:12,marginBottom:24}}>
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:40,height:40,borderRadius:10,background:"#EEF2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2}}>Pagina publica creada</p>
            <p style={{fontSize:12,color:"#64748B"}}>{companyData.nombre} · {companyData.slogan}</p>
          </div>
          <CheckIcon />
        </div>
        {tripData && (
          <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:"#EEF2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2}}>Primer viaje publicado</p>
              <p style={{fontSize:12,color:"#64748B"}}>{tripData.titulo} · Salida {fechaFormateada} · {tripData.precio} {tripData.moneda}/persona</p>
            </div>
            <CheckIcon />
          </div>
        )}
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:40,height:40,borderRadius:10,background:"#EEF2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2}}>Pipeline de reservas listo</p>
            <p style={{fontSize:12,color:"#64748B"}}>Recibe y gestiona solicitudes desde el dashboard</p>
          </div>
          <CheckIcon />
        </div>
      </div>
      <button style={{width:"100%",background:"#0A2540",color:"#fff",border:"none",borderRadius:12,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 24px rgba(10,37,64,0.25)"}}>
        Ir al Dashboard →
      </button>
      <p style={{textAlign:"center",fontSize:12,color:"#94A3B8",marginTop:12}}>Tu agencia ya esta en el sistema. Puedes completar el resto desde el dashboard.</p>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [phase, setPhase]             = useState(0);
  const [input, setInput]             = useState("");
  const [showForm, setShowForm]       = useState(false);
  const [showToolForm, setShowToolForm]           = useState(false);
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [showTripForm, setShowTripForm]           = useState(false);
  const [companyData, setCompanyData]   = useState<CompanyData | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [tripData, setTripData]         = useState<TripData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, showForm, showToolForm, showWorkspaceForm, showTripForm, phase]);

  useEffect(() => {
    const t = setTimeout(() => pushAI(
      "Hola. Soy el asistente de activacion de Traventia.\n\nEn menos de 3 minutos voy a dejarte listo:\n\n• Pagina publica para recibir clientes\n• Primer viaje publicado y listo para vender\n• Pipeline de reservas operativo\n• Estructura completa de tu agencia\n\nSolo necesito conocerte un poco.",
      ["Empecemos"]
    ), 300);
    return () => clearTimeout(t);
  }, []);

  function pushAI(content: string, chips: string[]) {
    setMessages(prev => [...prev, {id:uid(), role:"ai", content, chips}]);
  }
  function pushUser(content: string) {
    setMessages(prev => [...prev, {id:uid(), role:"user", content, chips:[]}]);
  }

  function handleChip(chip: string) {
    pushUser(chip);
    if (phase === 0) {
      setPhase(1);
      pushAI("Como describes mejor tu operacion de viajes?", TIPOS);
    } else if (phase === 1) {
      setPhase(2);
      setShowForm(true);
      pushAI("Detecte que operas como " + chip + ". Ahora necesito los datos de tu agencia para crear tu pagina publica.", []);
    } else if (phase === 6) {
      if (chip === "Crear Viaje") {
        setShowTripForm(true);
        pushAI("Perfecto. Cuentame sobre tu primer viaje. Entre mas detalles, mejor posicionado estara para tus clientes.", []);
      } else {
        setPhase(7);
        pushAI("Listo! Tu agencia ya esta activa. Puedes agregar viajes cuando quieras desde el dashboard.", []);
      }
    }
  }

  function handleCompanySubmit(company: CompanyData) {
    setCompanyData(company);
    setShowForm(false);
    setPhase(3);
  }

  function handleToolSubmit(tools: string[], incomplete: boolean) {
    setSelectedTools(tools);
    setShowToolForm(false);
    setPhase(5);
    setShowWorkspaceForm(true);
    const msg = incomplete
      ? "Sin problema. Puedes conectar mas herramientas desde el dashboard cuando estes listo.\n\nRevisa los campos que tendras disponibles en tu espacio de trabajo."
      : tools.length > 0
        ? `Genial! Integro ${tools.slice(0,3).join(", ")}${tools.length > 3 ? " y mas" : ""} a tu cuenta.\n\nAhora revisa los campos de tu espacio de trabajo.`
        : "Puedes conectar herramientas mas tarde.\n\nRevisa los campos de tu espacio de trabajo.";
    pushAI(msg, []);
  }

  function handleWorkspaceConfirm() {
    setShowWorkspaceForm(false);
    setPhase(6);
    pushAI(
      "Perfecto! Tu espacio de trabajo esta configurado.\n\nAhora creemos tu primer viaje para que comiences a recibir clientes de inmediato.",
      ["Crear Viaje", "Terminar por ahora"]
    );
  }

  function handleWorkspaceBack() {
    setShowWorkspaceForm(false);
    setPhase(4);
    setShowToolForm(true);
  }

  function handleTripSubmit(trip: TripData) {
    setTripData(trip);
    setShowTripForm(false);
    setPhase(7);
    const fecha = trip.fechaSalida
      ? new Date(trip.fechaSalida + "T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})
      : "";
    pushAI(
      "Excelente! Acabo de publicar \"" + trip.titulo + "\" con salida el " + fecha + ".\nPrecio: " + trip.precio + " " + trip.moneda + " por persona · Capacidad: " + trip.capacidad + " personas.\n\nYa puedes compartir tu pagina y empezar a recibir reservas.",
      []
    );
  }

  function handleTripSkip() {
    setShowTripForm(false);
    setPhase(7);
    pushAI("Sin problema. Tu agencia quedo configurada. Puedes agregar viajes desde el dashboard cuando estes listo.", []);
  }

  const lastAIMsg = [...messages].reverse().find(m => m.role === "ai" && m.chips.length > 0);
  const activeChips = lastAIMsg?.chips ?? [];
  const step = getDisplayStep(phase);

  return (
    <div style={{minHeight:"100vh",background:"#F7F8FA",fontFamily:"Inter,-apple-system,sans-serif"}}>
      <style dangerouslySetInnerHTML={{__html:"@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .msg-in{animation:fadeUp 0.35s ease forwards} @media(max-width:600px){.workspace-grid{grid-template-columns:1fr!important}.tool-grid{grid-template-columns:1fr!important}}"}} />

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(247,248,250,0.96)",borderBottom:"1px solid #E2E8F0",padding:"14px 24px"}}>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#16EFFF",boxShadow:"0 0 8px #16EFFF"}} />
            <span style={{fontSize:15,fontWeight:600,color:"#0A2540"}}>Traventia</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {phase > 0 && (
              <span style={{fontSize:12,color:"#64748B",fontWeight:500}}>Paso {step} de 6</span>
            )}
            <div style={{display:"flex",gap:5}}>
              {BAR_THRESHOLDS.map((threshold, i) => (
                <div key={i} style={{width:20,height:4,borderRadius:2,background:phase>=threshold?"#0A2540":"#E2E8F0",transition:"background 0.3s"}} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div style={{maxWidth:640,margin:"0 auto",padding:"32px 16px 160px"}}>
        {messages.map(msg => (
          <div key={msg.id} className="msg-in" style={{display:"flex",gap:12,marginBottom:12,justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-start"}}>
            {msg.role==="ai" && <AIAvatar />}
            <div style={{background:msg.role==="ai"?"#fff":"#0A2540",border:msg.role==="ai"?"1px solid #E2E8F0":"none",borderRadius:msg.role==="ai"?"0 18px 18px 18px":"18px 0 18px 18px",padding:"14px 18px",fontSize:14,color:msg.role==="ai"?"#1a2e45":"#fff",maxWidth:500,whiteSpace:"pre-line",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",lineHeight:1.6}}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Paso 2: Formulario empresa */}
        {showForm && <CompanyForm onSubmit={handleCompanySubmit} initialData={companyData} />}

        {/* Paso 3: Revisión empresa */}
        {phase === 3 && companyData && !showForm && (
          <div style={{maxWidth:640,margin:"20px auto",background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:20}}>
            <h3 style={{fontSize:16,fontWeight:600,color:"#0A2540",marginBottom:4}}>La informacion de tu agencia</h3>
            <p style={{fontSize:13,color:"#64748B",marginBottom:16}}>Confirma la informacion de tu agencia, pues la usara para hacer la configuracion.</p>
            <div style={{background:"#F7F8FA",borderRadius:8,padding:16,marginBottom:16,display:"grid",gap:12}}>
              {(["nombre","slogan","descripcion","mision","vision"] as const).map(k=>(
                <div key={k}><p style={{fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2,textTransform:"capitalize"}}>{k}</p><p style={{fontSize:13,color:"#1a2e45"}}>{companyData[k]}</p></div>
              ))}
            </div>
            <div style={{background:"#F7F8FA",borderRadius:8,padding:16,marginBottom:16,display:"grid",gap:12}}>
              <div><p style={{fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2}}>Email</p><p style={{fontSize:13,color:"#1a2e45"}}>{companyData.email}</p></div>
              <div><p style={{fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2}}>Telefono</p><p style={{fontSize:13,color:"#1a2e45"}}>{companyData.telefono}</p></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowForm(true)} style={{flex:"0 0 auto",background:"#fff",border:"1px solid #E2E8F0",borderRadius:6,padding:"10px 16px",cursor:"pointer",fontSize:13,color:"#0A2540",fontWeight:600}}>Editar</button>
              <button onClick={()=>{
                setPhase(4);
                setShowToolForm(true);
                pushAI(
                  "Perfecto, " + companyData.nombre.split(" ")[0] + "! Tu agencia esta configurada.\n\nAhora conectemos las herramientas que ya usas para que puedas gestionarlo todo desde un solo lugar.",
                  []
                );
              }} style={{flex:1,background:"#D946EF",color:"#fff",border:"none",borderRadius:6,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:600}}>
                Si, parece correcto
              </button>
            </div>
          </div>
        )}

        {/* Paso 4a: Herramientas */}
        {showToolForm && (
          <div className="tool-grid">
            <ToolSelectionForm onSubmit={handleToolSubmit} initialSelected={selectedTools} />
          </div>
        )}

        {/* Paso 4b: Workspace */}
        {showWorkspaceForm && (
          <div className="workspace-grid">
            <WorkspaceConfigForm onConfirm={handleWorkspaceConfirm} onBack={handleWorkspaceBack} />
          </div>
        )}

        {/* Paso 5: Formulario viaje */}
        {showTripForm && <TripForm onSubmit={handleTripSubmit} onSkip={handleTripSkip} />}

        {/* Paso 6: Éxito */}
        {phase === 7 && companyData && !showTripForm && <SuccessScreen companyData={companyData} tripData={tripData} />}

        <div ref={bottomRef} />
      </div>

      {/* Barra inferior con chips e input */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(247,248,250,0.96)",borderTop:"1px solid #E2E8F0",padding:"12px 16px 20px"}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          {activeChips.length > 0 && phase < 7 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12,justifyContent:activeChips.length===1?"center":"flex-start"}}>
              {activeChips.map(chip => (
                <Chip
                  key={chip}
                  label={chip}
                  primary={activeChips.length===1}
                  magenta={chip==="Crear Viaje" && phase===6}
                  onClick={()=>handleChip(chip)}
                />
              ))}
            </div>
          )}
          {phase < 7 && (
            <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:24,padding:"10px 14px",display:"flex",gap:10,boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}>
              <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Responde aqui..." style={{flex:1,border:"none",outline:"none",fontSize:14,color:"#0A2540",background:"transparent"}} />
              <button disabled={!input.trim()} style={{width:32,height:32,borderRadius:"50%",background:input.trim()?"#0A2540":"#EEF2F7",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={input.trim()?"#16EFFF":"#94A3B8"}><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
