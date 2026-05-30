"use client";
import { useState } from "react";

const TOOLS = [
  { id: "gmail",     label: "Gmail",                   desc: "Sincroniza correos y contactos" },
  { id: "calendar",  label: "Google Calendar",          desc: "Integra tu calendario" },
  { id: "outlook",   label: "Outlook",                  desc: "Correos corporativos" },
  { id: "hubspot",   label: "HubSpot for WordPress",    desc: "CRM y automatización" },
  { id: "linkedin",  label: "LinkedIn Sales Navigator", desc: "Prospecting B2B" },
  { id: "stripe",    label: "Stripe",                   desc: "Pagos en línea" },
] as const;

const EXTRA_TOOLS = [
  { id: "zapier",     label: "Zapier" },
  { id: "make",       label: "Make (Integromat)" },
  { id: "custom_api", label: "Custom API" },
  { id: "otra",       label: "Otra" },
];

interface Step4ToolsSelectorProps {
  initialSelected: string[];
  onSubmit: (tools: string[]) => void;
}

export function Step4ToolsSelector({ initialSelected, onSubmit }: Step4ToolsSelectorProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [extraSelected, setExtraSelected] = useState<string[]>([]);
  const [customTool, setCustomTool] = useState("");
  const [showModal, setShowModal] = useState(false);

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const toggleExtra = (id: string) =>
    setExtraSelected(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const totalSelected = selected.length + extraSelected.length;

  function handleConfirm() {
    const extras = customTool.trim() ? [...extraSelected, customTool.trim()] : extraSelected;
    onSubmit([...selected, ...extras]);
  }

  return (
    <div style={{ maxWidth:640,margin:"0 auto",padding:"20px" }}>
      <h2 style={{ fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:6 }}>Herramientas que usas</h2>
      <p style={{ fontSize:13,color:"#64748B",marginBottom:20 }}>Selecciona las herramientas que conectaremos con TOUR UP para automatizar tu gestión.</p>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
        {TOOLS.map(tool => {
          const isOn = selected.includes(tool.id);
          return (
            <button
              key={tool.id}
              onClick={() => toggle(tool.id)}
              style={{ display:"flex",alignItems:"flex-start",gap:10,background:"#fff",border:`1px solid ${isOn?"#0A2540":"#E2E8F0"}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"border-color 0.12s" }}
            >
              <div style={{ width:20,height:20,borderRadius:5,flexShrink:0,border:`2px solid ${isOn?"#0A2540":"#CBD5E1"}`,background:isOn?"#0A2540":"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.12s",marginTop:2 }}>
                {isOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <div>
                <span style={{ fontSize:13,color:"#0A2540",fontWeight:600,display:"block" }}>{tool.label}</span>
                <span style={{ fontSize:11,color:"#94A3B8",marginTop:2,display:"block" }}>{tool.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {extraSelected.length > 0 && (
        <div style={{ background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"8px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontSize:12,color:"#15803D" }}>
            {extraSelected.length} herramienta{extraSelected.length > 1 ? "s" : ""} adicional{extraSelected.length > 1 ? "es" : ""} seleccionada{extraSelected.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <button
          onClick={handleConfirm}
          disabled={totalSelected === 0}
          style={{ width:"100%",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,transition:"all 0.15s",cursor:totalSelected>0?"pointer":"default",background:totalSelected>0?"#D946EF":"#F1F5F9",color:totalSelected>0?"#fff":"#94A3B8",boxShadow:totalSelected>0?"0 4px 20px rgba(217,70,239,0.25)":"none" }}
        >
          Terminar de seleccionar mis herramientas
        </button>
        <button
          onClick={() => setShowModal(true)}
          style={{ width:"100%",background:"#fff",color:"#64748B",border:"1px solid #CBD5E1",borderRadius:10,padding:"12px",fontSize:14,cursor:"pointer" }}
        >
          Me falta algunas herramientas
        </button>
      </div>

      {showModal && (
        <div
          style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background:"#fff",borderRadius:16,padding:24,maxWidth:400,width:"100%",boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <h3 style={{ fontSize:16,fontWeight:700,color:"#0A2540",margin:0 }}>Más herramientas</h3>
              <button onClick={() => setShowModal(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"#64748B",padding:4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display:"grid",gap:8,marginBottom:14 }}>
              {EXTRA_TOOLS.map(t => {
                const isOn = extraSelected.includes(t.id);
                return (
                  <button
                    key={t.id} onClick={() => toggleExtra(t.id)}
                    style={{ display:"flex",alignItems:"center",gap:10,background:"#fff",border:`1px solid ${isOn?"#0A2540":"#E2E8F0"}`,borderRadius:8,padding:"10px 12px",cursor:"pointer" }}
                  >
                    <div style={{ width:18,height:18,borderRadius:4,border:`2px solid ${isOn?"#0A2540":"#CBD5E1"}`,background:isOn?"#0A2540":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {isOn && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ fontSize:13,color:"#0A2540",fontWeight:500 }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#64748B",marginBottom:6 }}>O escribe otra herramienta:</label>
              <input
                value={customTool}
                onChange={e => setCustomTool(e.target.value)}
                placeholder="Nombre de la herramienta"
                style={{ width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#0A2540",boxSizing:"border-box" }}
              />
            </div>
            <button
              onClick={() => setShowModal(false)}
              style={{ width:"100%",background:"#0A2540",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:600,cursor:"pointer" }}
            >
              Guardar selección
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
