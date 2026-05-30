"use client";
import { useRef, useState } from "react";
import { AIImageGenerationModal } from "./AIImageGenerationModal";

interface Step5LogoUploaderProps {
  logo: string;
  onLogoChange: (logo: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function Step5LogoUploader({ logo, onLogoChange, onNext, onSkip }: Step5LogoUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => onLogoChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"20px" }}>
      <h2 style={{ fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:6 }}>Logo de la agencia</h2>
      <p style={{ fontSize:13,color:"#64748B",marginBottom:20 }}>Aparecerá en tu landing, correos y comunicaciones.</p>

      <input
        ref={inputRef} type="file" accept="image/png,image/svg+xml,image/jpeg"
        style={{ display:"none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div style={{ display:"flex",justifyContent:"center",marginBottom:16 }}>
        <div
          style={{ width:200,height:200,borderRadius:16,overflow:"hidden",background:dragging?"#F0F4FF":"#F7F8FA",border:`2px dashed ${dragging?"#3B82F6":logo?"transparent":"#CBD5E1"}`,cursor:logo?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,position:"relative",transition:"all 0.15s" }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          onClick={() => !logo && inputRef.current?.click()}
        >
          {logo ? (
            <>
              <img src={logo} alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain",padding:20,boxSizing:"border-box" }} />
              <button
                onClick={e => { e.stopPropagation(); onLogoChange(""); }}
                style={{ position:"absolute",top:8,right:8,width:24,height:24,borderRadius:"50%",background:"rgba(0,0,0,0.5)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ fontSize:12,color:"#94A3B8" }}>Subir logo</span>
              <span style={{ fontSize:10,color:"#CBD5E1" }}>PNG · SVG · JPG</span>
            </>
          )}
        </div>
      </div>

      <div style={{ background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"9px 12px",marginBottom:20 }}>
        <p style={{ fontSize:12,color:"#15803D",margin:0,lineHeight:1.5 }}>
          💡 PNG o SVG con fondo transparente · Mínimo 200×200 px recomendado
        </p>
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <button
          onClick={() => setShowModal(true)}
          style={{ width:"100%",background:"#D946EF",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 20px rgba(217,70,239,0.25)",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Generar logo con IA
        </button>
        {logo && (
          <button
            onClick={onNext}
            style={{ width:"100%",background:"#0A2540",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer" }}
          >
            Continuar con este logo →
          </button>
        )}
        {logo && (
          <button
            onClick={() => inputRef.current?.click()}
            style={{ width:"100%",background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,padding:"12px",fontSize:14,color:"#0A2540",cursor:"pointer" }}
          >
            Subir otro logo
          </button>
        )}
        <button
          onClick={onSkip}
          style={{ background:"none",border:"none",fontSize:13,color:"#94A3B8",cursor:"pointer",textDecoration:"underline",padding:"4px" }}
        >
          Omitir por ahora
        </button>
      </div>

      {showModal && (
        <AIImageGenerationModal
          type="logo"
          onSelect={url => { onLogoChange(url); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
