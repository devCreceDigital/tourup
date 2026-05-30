"use client";
import { useState } from "react";

const LANDING_STYLES = [
  "Aventura y naturaleza", "Playa y relajación",
  "Cultura y patrimonio", "Lujo y exclusividad",
  "Aventura extrema", "Familiar",
];
const LOGO_STYLES = ["Moderno", "Clásico", "Minimalista", "Geométrico", "Orgánico", "Vintage"];
const LOGO_COLORS = ["Azul", "Turquesa", "Verde", "Naranja", "Rosa", "Negro", "Multicolor"];

function mockImages(type: "landing" | "logo"): string[] {
  return Array.from({ length: 4 }, (_, i) => {
    const seed = Math.floor(Math.random() * 9000) + 1000 + i * 17;
    return type === "landing"
      ? `https://picsum.photos/seed/${seed}/600/300`
      : `https://picsum.photos/seed/${seed}/400/400`;
  });
}

export interface AIImageGenerationModalProps {
  type: "landing" | "logo";
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function AIImageGenerationModal({ type, onSelect, onClose }: AIImageGenerationModalProps) {
  const [style, setStyle] = useState("");
  const [description, setDescription] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const styleOptions = type === "landing" ? LANDING_STYLES : LOGO_STYLES;

  function handleGenerate() {
    if (!style) return;
    setLoading(true);
    setTimeout(() => { setImages(mockImages(type)); setLoading(false); }, 1600);
  }

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:"#fff",borderRadius:16,padding:24,maxWidth:540,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 12px 48px rgba(0,0,0,0.22)" }}>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ fontSize:17,fontWeight:700,color:"#0A2540",margin:0 }}>
            {type === "landing" ? "Generar fotos con IA" : "Generar logo con IA"}
          </h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#64748B",padding:4,borderRadius:6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8 }}>
            {type === "landing" ? "Estilo de fotos" : "Estilo del logo"}
          </label>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7 }}>
            {styleOptions.map(s => (
              <button
                key={s} onClick={() => setStyle(s)}
                style={{ padding:"9px 12px",borderRadius:8,border:"1px solid",textAlign:"left",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:8,transition:"all 0.12s",borderColor:style===s?"#D946EF":"#E2E8F0",background:style===s?"rgba(217,70,239,0.07)":"#fff",color:style===s?"#D946EF":"#475569",fontWeight:style===s?600:400 }}
              >
                <div style={{ width:13,height:13,borderRadius:"50%",flexShrink:0,transition:"all 0.12s",border:`2px solid ${style===s?"#D946EF":"#CBD5E1"}`,background:style===s?"#D946EF":"#fff" }} />
                {s}
              </button>
            ))}
          </div>
        </div>

        {type === "logo" && (
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8 }}>
              Colores preferidos <span style={{ fontWeight:400,color:"#94A3B8" }}>(opcional)</span>
            </label>
            <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
              {LOGO_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColors(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])}
                  style={{ padding:"4px 11px",borderRadius:14,border:"1px solid",fontSize:12,cursor:"pointer",borderColor:colors.includes(c)?"#0A2540":"#E2E8F0",background:colors.includes(c)?"#0A2540":"#fff",color:colors.includes(c)?"#fff":"#475569",fontWeight:colors.includes(c)?600:400 }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8 }}>
            {type === "landing" ? "Tipo de destino" : "Elementos a incluir"}
            <span style={{ fontWeight:400,color:"#94A3B8" }}> (opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={type === "landing" ? "Ej: playas tropicales, montañas nevadas, ciudades europeas" : "Ej: montañas, avión, mapa, brújula"}
            style={{ width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#0A2540",boxSizing:"border-box",minHeight:68,fontFamily:"inherit",resize:"vertical" }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!style || loading}
          style={{ width:"100%",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:600,cursor:!style||loading?"default":"pointer",marginBottom:images.length?14:0,background:!style||loading?"#F1F5F9":"#D946EF",color:!style||loading?"#94A3B8":"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"background 0.15s" }}
        >
          {loading ? (
            <>
              <div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.75s linear infinite" }} />
              Generando...
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {type === "landing" ? "Generar 4 imágenes" : "Generar 4 logos"}
            </>
          )}
        </button>

        {images.length > 0 && !loading && (
          <div>
            <p style={{ fontSize:12,color:"#64748B",marginBottom:10 }}>Haz clic en una imagen para usarla:</p>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
              {images.map((url, i) => (
                <div
                  key={i}
                  style={{ position:"relative",borderRadius:8,overflow:"hidden",cursor:"pointer",border:`2px solid ${hoveredIdx===i?"#D946EF":"transparent"}`,transition:"border-color 0.12s" }}
                  onClick={() => { onSelect(url); onClose(); }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <img src={url} alt={`Opción ${i + 1}`} style={{ width:"100%",aspectRatio:type==="landing"?"2/1":"1/1",objectFit:"cover",display:"block" }} />
                  {hoveredIdx === i && (
                    <div style={{ position:"absolute",inset:0,background:"rgba(217,70,239,0.38)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <span style={{ background:"#D946EF",color:"#fff",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:6 }}>Usar esta</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              style={{ width:"100%",background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,padding:"10px",fontSize:13,color:"#475569",cursor:"pointer" }}
            >
              {type === "landing" ? "Generar otras opciones" : "Generar otro estilo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
