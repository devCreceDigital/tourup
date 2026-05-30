"use client";
import { useState, useRef } from "react";

interface Step6ConversationalInputProps {
  onSubmit: (input: string) => void;
}

export function Step6ConversationalInput({ onSubmit }: Step6ConversationalInputProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    onSubmit(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{ maxWidth:640,margin:"20px auto",padding:"0" }}>
      <div style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
        <textarea
          ref={ref}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder={"Describe tu viaje... Ej: 'Viaje a Japón en octubre por 2 semanas para parejas con visitas a templos'..."}
          style={{ width:"100%",minHeight:100,maxHeight:200,border:"none",outline:"none",padding:"16px",fontSize:14,color:"#0A2540",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box",lineHeight:1.6,background:loading?"#F7F8FA":"#fff" }}
        />
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderTop:"1px solid #F1F5F9" }}>
          <span style={{ fontSize:11,color:"#94A3B8" }}>Ctrl+Enter para enviar</span>
          <button
            onClick={handleSend}
            disabled={!value.trim() || loading}
            style={{ display:"flex",alignItems:"center",gap:7,background:value.trim()&&!loading?"#0A2540":"#EEF2F7",color:value.trim()&&!loading?"#fff":"#94A3B8",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:value.trim()&&!loading?"pointer":"default",transition:"all 0.15s" }}
          >
            {loading ? (
              <>
                <div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.75s linear infinite" }} />
                Analizando...
              </>
            ) : (
              <>
                Enviar
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              </>
            )}
          </button>
        </div>
      </div>
      <p style={{ textAlign:"center",fontSize:11,color:"#CBD5E1",marginTop:8 }}>
        Cuanto más detallado, mejor pre-llenaremos el formulario
      </p>
    </div>
  );
}
