"use client";
import { useState } from "react";
import type { LandingTexts } from "@/lib/api/onboarding";

interface Step5LandingPreviewProps {
  photos: string[];
  logo: string;
  agencyName: string;
  slogan: string;
  landingTexts: LandingTexts;
  onLandingTextsChange: (texts: LandingTexts) => void;
  onConfirm: () => void;
  onSkip: () => void;
}

const TEXT_FIELDS: { key: keyof LandingTexts; label: string; placeholder: string }[] = [
  { key: "serviceName1", label: "Servicio 1 — Título",      placeholder: "Ej: Viajes Exclusivos" },
  { key: "serviceDesc1", label: "Servicio 1 — Descripción", placeholder: "Ej: Experiencias personalizadas" },
  { key: "serviceName2", label: "Servicio 2 — Título",      placeholder: "Ej: Hoteles Premium" },
  { key: "serviceDesc2", label: "Servicio 2 — Descripción", placeholder: "Ej: Alojamiento de lujo" },
  { key: "ctaText",      label: "Texto del botón CTA",      placeholder: "Ej: Contactar por WhatsApp" },
];

export function Step5LandingPreview({ photos, logo, agencyName, slogan, landingTexts, onLandingTextsChange, onConfirm, onSkip }: Step5LandingPreviewProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [draft, setDraft] = useState<LandingTexts>(landingTexts);

  const bannerPhoto = photos.find(p => p !== "") ?? "";

  return (
    <div style={{ maxWidth:640,margin:"0 auto",padding:"20px" }}>
      <h2 style={{ fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:6 }}>Vista previa de tu landing</h2>
      <p style={{ fontSize:13,color:"#64748B",marginBottom:16 }}>Así se verá tu página pública en TOUR UP.</p>

      {/* Preview card */}
      <div style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,overflow:"hidden",marginBottom:20,boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
        {/* Banner */}
        <div style={{ position:"relative",height:200,background:"linear-gradient(135deg,#0A2540,#1a3a5c)",overflow:"hidden" }}>
          {bannerPhoto && (
            <img src={bannerPhoto} alt="Banner" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
          )}
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.38)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 32px" }}>
            {logo && (
              <img src={logo} alt="Logo" style={{ width:54,height:54,objectFit:"contain",borderRadius:10,background:"rgba(255,255,255,0.15)",padding:6,marginBottom:12 }} />
            )}
            <h3 style={{ fontSize:22,fontWeight:700,color:"#fff",marginBottom:4,textAlign:"center",textShadow:"0 1px 6px rgba(0,0,0,0.5)",margin:"0 0 4px" }}>
              {agencyName || "Tu Agencia"}
            </h3>
            <p style={{ fontSize:13,color:"rgba(255,255,255,0.8)",textAlign:"center",textShadow:"0 1px 4px rgba(0,0,0,0.4)",margin:0 }}>
              {slogan || "Tu slogan aquí"}
            </p>
          </div>
        </div>

        {/* Services */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:"1px solid #E2E8F0" }}>
          <div style={{ padding:"14px 16px",borderRight:"1px solid #E2E8F0" }}>
            <div style={{ fontSize:22,marginBottom:6 }}>✈️</div>
            <p style={{ fontSize:13,fontWeight:600,color:"#0A2540",margin:"0 0 2px" }}>{landingTexts.serviceName1 || "Viajes Exclusivos"}</p>
            <p style={{ fontSize:11,color:"#64748B",margin:0 }}>{landingTexts.serviceDesc1 || "Experiencias personalizadas"}</p>
          </div>
          <div style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:22,marginBottom:6 }}>🏨</div>
            <p style={{ fontSize:13,fontWeight:600,color:"#0A2540",margin:"0 0 2px" }}>{landingTexts.serviceName2 || "Hoteles Premium"}</p>
            <p style={{ fontSize:11,color:"#64748B",margin:0 }}>{landingTexts.serviceDesc2 || "Alojamiento de lujo"}</p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding:"12px 16px",borderTop:"1px solid #E2E8F0" }}>
          <div style={{ background:"#10B981",borderRadius:10,padding:"12px",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            <span style={{ fontSize:16 }}>💬</span>
            <span style={{ fontSize:13,fontWeight:600,color:"#fff" }}>{landingTexts.ctaText || "Contactar por WhatsApp"}</span>
          </div>
        </div>

        <p style={{ textAlign:"center",fontSize:10,color:"#CBD5E1",padding:"8px",margin:0 }}>
          Vista previa de tu landing público
        </p>
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <button
          onClick={onConfirm}
          style={{ width:"100%",background:"#D946EF",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 20px rgba(217,70,239,0.25)" }}
        >
          Usar esta propuesta
        </button>
        <button
          onClick={() => { setDraft(landingTexts); setShowEditModal(true); }}
          style={{ width:"100%",background:"#fff",color:"#0A2540",border:"1px solid #E2E8F0",borderRadius:10,padding:"12px",fontSize:14,cursor:"pointer",fontWeight:500 }}
        >
          Editar textos
        </button>
        <button
          onClick={onSkip}
          style={{ background:"none",border:"none",fontSize:13,color:"#94A3B8",cursor:"pointer",textDecoration:"underline",padding:"4px" }}
        >
          Lo haré luego
        </button>
      </div>

      {showEditModal && (
        <div
          style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}
        >
          <div style={{ background:"#fff",borderRadius:16,padding:24,maxWidth:480,width:"100%",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 12px 48px rgba(0,0,0,0.18)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <h3 style={{ fontSize:16,fontWeight:700,color:"#0A2540",margin:0 }}>Editar textos del landing</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"#64748B",padding:4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {TEXT_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#64748B",marginBottom:6 }}>{label}</label>
                <input
                  value={draft[key]}
                  onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#0A2540",boxSizing:"border-box" }}
                />
              </div>
            ))}
            <button
              onClick={() => { onLandingTextsChange(draft); setShowEditModal(false); }}
              style={{ width:"100%",background:"#D946EF",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:600,cursor:"pointer",marginTop:4 }}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
