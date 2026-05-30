"use client";
import { useEffect, useState } from "react";
import { generateSlugFromName, validateSlug } from "@/lib/api/onboarding";
import type { WorkspaceConfig } from "@/lib/api/onboarding";

interface Step5WorkspaceConfigProps {
  agencyName: string;
  config: WorkspaceConfig;
  onChange: (config: WorkspaceConfig) => void;
  onSubmit: () => void;
  onBack: () => void;
  onSkip: () => void;
  loading: boolean;
}

type ToggleKey = "isSubscriptionActive" | "isPublic" | "emailNotifications";

const TOGGLES: { key: ToggleKey; label: string; desc: string }[] = [
  { key: "isSubscriptionActive", label: "Suscripción activa",       desc: "Acceso a todas las features de TOUR UP" },
  { key: "isPublic",             label: "Landing público",          desc: "Tu página será visible en la web" },
  { key: "emailNotifications",   label: "Notificaciones por email", desc: "Recibe actualizaciones de tu cuenta" },
];

export function Step5WorkspaceConfig({ agencyName, config, onChange, onSubmit, onBack, onSkip, loading }: Step5WorkspaceConfigProps) {
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.slug && agencyName) {
      onChange({ ...config, slug: generateSlugFromName(agencyName) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyName]);

  function handleSlugChange(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    onChange({ ...config, slug: cleaned });
    setSlugError(validateSlug(cleaned));
  }

  function handleToggle(key: ToggleKey) {
    onChange({ ...config, [key]: !config[key] });
  }

  const canSubmit = !slugError && config.slug.length >= 3 && !loading;

  return (
    <div style={{ maxWidth:560,margin:"0 auto",padding:"20px" }}>
      <h2 style={{ fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:6 }}>Configuración final</h2>
      <p style={{ fontSize:13,color:"#64748B",marginBottom:24 }}>Define la URL y las opciones de tu espacio de trabajo.</p>

      {/* Slug */}
      <div style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16,marginBottom:12 }}>
        <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:4 }}>URL de tu agencia</label>
        <p style={{ fontSize:11,color:"#94A3B8",marginBottom:10,margin:"0 0 10px" }}>
          tourup.com/<strong style={{ color:"#0A2540" }}>{config.slug || "tu-agencia"}</strong>
        </p>
        <input
          value={config.slug}
          onChange={e => handleSlugChange(e.target.value)}
          placeholder="tu-agencia"
          style={{ width:"100%",border:`1px solid ${slugError?"#EF4444":config.slug.length>=3?"#22C55E":"#E2E8F0"}`,borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540",boxSizing:"border-box",transition:"border-color 0.15s" }}
        />
        {slugError && <p style={{ fontSize:11,color:"#EF4444",marginTop:5,marginBottom:0 }}>{slugError}</p>}
        {!slugError && config.slug.length >= 3 && (
          <p style={{ fontSize:11,color:"#22C55E",marginTop:5,marginBottom:0 }}>✓ Disponible</p>
        )}
        <p style={{ fontSize:11,color:"#94A3B8",marginTop:5,marginBottom:0 }}>Solo letras minúsculas, números y guiones</p>
      </div>

      {TOGGLES.map(({ key, label, desc }) => (
        <div key={key} style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16,marginBottom:12,display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14,fontWeight:500,color:"#0A2540",margin:"0 0 2px" }}>{label}</p>
            <p style={{ fontSize:12,color:"#64748B",margin:0 }}>{desc}</p>
          </div>
          <button
            onClick={() => handleToggle(key)}
            style={{ width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",background:config[key]?"#D946EF":"#E2E8F0",position:"relative",flexShrink:0,transition:"background 0.2s" }}
          >
            <div style={{ width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:config[key]?23:3,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
          </button>
        </div>
      ))}

      <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:24 }}>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          style={{ width:"100%",border:"none",borderRadius:10,padding:"16px",fontSize:15,fontWeight:700,transition:"all 0.15s",cursor:canSubmit?"pointer":"default",background:canSubmit?"#D946EF":"#F1F5F9",color:canSubmit?"#fff":"#94A3B8",boxShadow:canSubmit?"0 4px 24px rgba(217,70,239,0.3)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}
        >
          {loading ? (
            <>
              <div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.75s linear infinite" }} />
              Creando tu agencia...
            </>
          ) : "Crear mi agencia"}
        </button>
        <button
          onClick={onBack}
          style={{ width:"100%",background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,padding:"12px",fontSize:14,color:"#0A2540",cursor:"pointer" }}
        >
          Editar landing
        </button>
        <button
          onClick={onSkip}
          style={{ background:"none",border:"none",fontSize:13,color:"#94A3B8",cursor:"pointer",textDecoration:"underline",padding:"4px" }}
        >
          Lo haré después
        </button>
      </div>
    </div>
  );
}
