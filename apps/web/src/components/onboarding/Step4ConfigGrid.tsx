"use client";
import { useState } from "react";
import type { ConfigFields } from "@/lib/api/onboarding";

interface CardDef {
  id: keyof ConfigFields;
  title: string;
  description: string;
  iconColor: string;
  iconPath: string;
  fields: string[];
}

const CARDS: CardDef[] = [
  {
    id: "contactos",
    title: "Contactos",
    description: "Define qué información guardarás de cada cliente",
    iconColor: "#0A2540",
    iconPath: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    fields: ["Fecha de última interacción","Área de especialización","Nivel de influencia","Preferencia de comunicación","Documento de identidad","Teléfono móvil","Empresa asociada"],
  },
  {
    id: "empresas",
    title: "Empresas",
    description: "Información sobre las empresas de tus clientes",
    iconColor: "#16A34A",
    iconPath: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    fields: ["Industria principal","Tipo de cliente","Número de empleados","Fecha de fundación","País/Región","Sitio web","Teléfono corporativo"],
  },
  {
    id: "negocios",
    title: "Negocios",
    description: "Gestión de proyectos y viajes",
    iconColor: "#F59E0B",
    iconPath: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    fields: ["Duración estimada del proyecto","Tipo de servicio ofrecido","Fecha estimada de finalización","Fecha de inicio del proyecto","Presupuesto estimado","Estado del proyecto","Probabilidad de cierre"],
  },
  {
    id: "tickets",
    title: "Tickets",
    description: "Gestión de solicitudes y problemas",
    iconColor: "#9333EA",
    iconPath: "M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 1 2-2z",
    fields: ["Fecha de creación del ticket","Categoría del problema","Método de reporte","Prioridad del ticket","Tiempo de respuesta requerido","Asignado a"],
  },
];

interface Step4ConfigGridProps {
  onConfirm: (fields: ConfigFields) => void;
  onBack: () => void;
}

export function Step4ConfigGrid({ onConfirm, onBack }: Step4ConfigGridProps) {
  const [fields, setFields] = useState<ConfigFields>({ contactos:[], empresas:[], negocios:[], tickets:[] });

  function toggleField(cardId: keyof ConfigFields, field: string) {
    setFields(prev => ({
      ...prev,
      [cardId]: prev[cardId].includes(field)
        ? prev[cardId].filter(f => f !== field)
        : [...prev[cardId], field],
    }));
  }

  const hasAny = Object.values(fields).some(arr => arr.length > 0);

  return (
    <div style={{ maxWidth:640,margin:"0 auto",padding:"20px" }}>
      <h2 style={{ fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:6 }}>Configuración de tu espacio de trabajo</h2>
      <p style={{ fontSize:13,color:"#64748B",marginBottom:20 }}>Selecciona los campos que usarás para gestionar tu negocio.</p>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24 }}>
        {CARDS.map(card => {
          const checked = fields[card.id];
          return (
            <div key={card.id} style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                <div style={{ width:32,height:32,borderRadius:8,background:`${card.iconColor}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={card.iconColor} strokeWidth="2">
                    <path d={card.iconPath}/>
                  </svg>
                </div>
                <span style={{ fontSize:13,fontWeight:700,color:"#0A2540" }}>{card.title}</span>
              </div>
              <p style={{ fontSize:11,color:"#94A3B8",marginBottom:10,lineHeight:1.4 }}>{card.description}</p>
              <div style={{ display:"grid",gap:5 }}>
                {card.fields.map(field => {
                  const isOn = checked.includes(field);
                  return (
                    <button
                      key={field}
                      onClick={() => toggleField(card.id, field)}
                      style={{ display:"flex",alignItems:"center",gap:7,background:"none",border:"none",cursor:"pointer",padding:"2px 0",textAlign:"left" }}
                    >
                      <div style={{ width:14,height:14,borderRadius:3,border:`1.5px solid ${isOn?"#0A2540":"#CBD5E1"}`,background:isOn?"#0A2540":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.1s" }}>
                        {isOn && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{ fontSize:11,color:isOn?"#0A2540":"#64748B",fontWeight:isOn?500:400,lineHeight:1.4 }}>{field}</span>
                    </button>
                  );
                })}
              </div>
              {checked.length > 0 && (
                <div style={{ marginTop:8,padding:"3px 8px",background:`${card.iconColor}12`,borderRadius:5,display:"inline-block" }}>
                  <span style={{ fontSize:10,color:card.iconColor,fontWeight:600 }}>
                    {checked.length} campo{checked.length > 1 ? "s" : ""} seleccionado{checked.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <button
          onClick={() => hasAny && onConfirm(fields)}
          disabled={!hasAny}
          style={{ width:"100%",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,transition:"all 0.15s",cursor:hasAny?"pointer":"default",background:hasAny?"#D946EF":"#F1F5F9",color:hasAny?"#fff":"#94A3B8",boxShadow:hasAny?"0 4px 20px rgba(217,70,239,0.25)":"none" }}
        >
          Sí, pasemos a crear tu landing
        </button>
        <button
          onClick={onBack}
          style={{ width:"100%",background:"#fff",color:"#64748B",border:"1px solid #CBD5E1",borderRadius:10,padding:"12px",fontSize:14,cursor:"pointer" }}
        >
          Me gustaría hacer cambios
        </button>
      </div>
    </div>
  );
}
