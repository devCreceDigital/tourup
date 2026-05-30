"use client";
import { useRef, useState } from "react";
import { AIImageGenerationModal } from "./AIImageGenerationModal";

interface Step5PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function Step5PhotoUploader({ photos, onPhotosChange, onNext, onSkip }: Step5PhotoUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSlot = useRef(0);

  const slots = Array.from({ length: 4 }, (_, i) => photos[i] ?? "");
  const filled = slots.filter(p => p !== "").length;

  function setSlotPhoto(slot: number, url: string) {
    const next = Array.from({ length: 4 }, (_, i) => photos[i] ?? "");
    next[slot] = url;
    onPhotosChange(next);
  }

  function removePhoto(slot: number) {
    setSlotPhoto(slot, "");
  }

  function handleFile(file: File, slot: number) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setSlotPhoto(slot, e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function openPicker(slot: number) {
    activeSlot.current = slot;
    if (inputRef.current) { inputRef.current.value = ""; inputRef.current.click(); }
  }

  function handleAISelect(url: string) {
    const firstEmpty = slots.findIndex(p => p === "");
    setSlotPhoto(firstEmpty >= 0 ? firstEmpty : 0, url);
    setShowModal(false);
  }

  return (
    <div style={{ maxWidth:640,margin:"0 auto",padding:"20px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
        <h2 style={{ fontSize:18,fontWeight:600,color:"#0A2540",margin:0 }}>Fotos de portada</h2>
        <span style={{ fontSize:12,color:filled===4?"#16A34A":"#64748B",fontWeight:600 }}>{filled}/4 fotos</span>
      </div>
      <p style={{ fontSize:13,color:"#64748B",marginBottom:20 }}>Sube hasta 4 fotos horizontales que representen tu agencia.</p>

      <input
        ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display:"none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f, activeSlot.current); }}
      />

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
        {slots.map((photo, i) => (
          <div
            key={i}
            style={{ position:"relative",borderRadius:10,overflow:"hidden",aspectRatio:"2/1",background:dragging===i?"#F0F4FF":"#F7F8FA",border:`2px dashed ${dragging===i?"#3B82F6":photo?"transparent":"#CBD5E1"}`,cursor:photo?"default":"pointer",transition:"all 0.15s" }}
            onDragOver={e => { e.preventDefault(); setDragging(i); }}
            onDragLeave={() => setDragging(null)}
            onDrop={e => { e.preventDefault(); setDragging(null); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f, i); }}
            onClick={() => !photo && openPicker(i)}
          >
            {photo ? (
              <>
                <img src={photo} alt={`Foto ${i + 1}`} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
                <button
                  onClick={e => { e.stopPropagation(); removePhoto(i); }}
                  style={{ position:"absolute",top:6,right:6,width:22,height:22,borderRadius:"50%",background:"rgba(0,0,0,0.55)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); openPicker(i); }}
                  style={{ position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,0.55)",border:"none",cursor:"pointer",borderRadius:5,padding:"2px 7px",color:"#fff",fontSize:10,fontWeight:600 }}
                >
                  Cambiar
                </button>
              </>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:6 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style={{ fontSize:11,color:"#94A3B8" }}>Foto {i + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:8,padding:"9px 12px",marginBottom:20 }}>
        <p style={{ fontSize:12,color:"#92400E",margin:0,lineHeight:1.5 }}>
          ⚠️ Usa fotos horizontales de alta resolución · 💡 Muestra destinos, actividades o experiencias
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
          Generar fotos con IA
        </button>
        {filled >= 1 && (
          <button
            onClick={onNext}
            style={{ width:"100%",background:"#0A2540",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer" }}
          >
            Continuar con {filled} foto{filled > 1 ? "s" : ""} →
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
          type="landing"
          onSelect={handleAISelect}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
