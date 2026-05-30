"use client";
import type { TripData } from "@/lib/onboarding/validateTrip";

const TYPE_EMOJI: Record<string, string> = {
  "Aventura":"🏔️","Playa y relajación":"🏖️","Cultural y patrimonio":"🏛️",
  "Lujo y bienestar":"💎","Negocios":"💼","Familiar":"👨‍👩‍👧","Grupos":"👥","Otro":"✈️",
};

interface Step6TripPreviewProps {
  tripData: TripData;
  onPublish: () => void;
  onEdit: () => void;
  onSkip: () => void;
  loading: boolean;
}

export function Step6TripPreview({ tripData, onPublish, onEdit, onSkip, loading }: Step6TripPreviewProps) {
  const emoji = TYPE_EMOJI[tripData.type] ?? "✈️";
  const desc = tripData.description.length > 150
    ? tripData.description.slice(0, 150) + "..."
    : tripData.description;

  return (
    <div style={{ maxWidth:640,margin:"20px auto",padding:"0" }}>
      {/* Preview card */}
      <div style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,overflow:"hidden",marginBottom:20,boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
        {/* Header gradiente */}
        <div style={{ background:"linear-gradient(135deg,#3B82F6,#1E40AF)",padding:"28px 24px",position:"relative",minHeight:120,display:"flex",flexDirection:"column",justifyContent:"flex-end" }}>
          <div style={{ position:"absolute",top:16,left:20,fontSize:28,opacity:0.8 }}>{emoji}</div>
          <h3 style={{ fontSize:22,fontWeight:700,color:"#fff",margin:0,textShadow:"0 1px 6px rgba(0,0,0,0.3)",lineHeight:1.3 }}>
            {tripData.title || "Sin título"}
          </h3>
          {tripData.destinationMain && (
            <p style={{ fontSize:13,color:"rgba(255,255,255,0.8)",margin:"4px 0 0",textShadow:"0 1px 4px rgba(0,0,0,0.2)" }}>
              📍 {tripData.destinationMain}
            </p>
          )}
        </div>

        {/* Contenido */}
        <div style={{ padding:20 }}>
          <p style={{ fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16 }}>{desc || "Sin descripción"}</p>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,borderTop:"1px solid #F1F5F9",borderLeft:"1px solid #F1F5F9" }}>
            {[
              { icon:"📅", label:"Duración",  value: tripData.durationDays ? `${tripData.durationDays} días` : "—" },
              { icon:"👥", label:"Viajeros",  value: tripData.travelerTypes.join(", ") || "—" },
              { icon:"🧑‍🤝‍🧑", label:"Capacidad", value: tripData.maxCapacity ? `Hasta ${tripData.maxCapacity} personas` : "—" },
              { icon:"💵", label:"Precio",    value: tripData.priceFrom ? `Desde ${tripData.currency} ${tripData.priceFrom.toLocaleString()}` : "—" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ padding:"12px 14px",borderBottom:"1px solid #F1F5F9",borderRight:"1px solid #F1F5F9" }}>
                <div style={{ fontSize:11,fontWeight:600,color:"#94A3B8",letterSpacing:"0.05em",marginBottom:4 }}>{icon} {label.toUpperCase()}</div>
                <div style={{ fontSize:13,fontWeight:500,color:"#0A2540" }}>{value}</div>
              </div>
            ))}
          </div>

          {tripData.activities.length > 0 && (
            <div style={{ marginTop:16 }}>
              <p style={{ fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.05em",marginBottom:8 }}>🎯 INCLUYE</p>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {tripData.activities.slice(0, 6).map(a => (
                  <span key={a} style={{ background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:12,padding:"3px 10px",fontSize:12,color:"#15803D",fontWeight:500 }}>{a}</span>
                ))}
                {tripData.activities.length > 6 && (
                  <span style={{ background:"#F7F8FA",border:"1px solid #E2E8F0",borderRadius:12,padding:"3px 10px",fontSize:12,color:"#64748B" }}>+{tripData.activities.length - 6} más</span>
                )}
              </div>
            </div>
          )}

          {tripData.includes.length > 0 && (
            <div style={{ marginTop:14,padding:"10px 14px",background:"#F0FDF4",borderRadius:8,display:"flex",flexWrap:"wrap",gap:10 }}>
              {tripData.includes.map(i => (
                <div key={i} style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#15803D" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {i}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <button
          onClick={onPublish}
          disabled={loading}
          style={{ width:"100%",background:loading?"#F1F5F9":"#10B981",color:loading?"#94A3B8":"#fff",border:"none",borderRadius:10,padding:"16px",fontSize:16,fontWeight:700,cursor:loading?"default":"pointer",boxShadow:loading?"none":"0 4px 20px rgba(16,185,129,0.3)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.15s" }}
        >
          {loading ? (
            <>
              <div style={{ width:16,height:16,border:"2px solid rgba(150,150,150,0.3)",borderTopColor:"#94A3B8",borderRadius:"50%",animation:"spin 0.75s linear infinite" }} />
              Publicando...
            </>
          ) : "¡Publicar este viaje! 🚀"}
        </button>
        <button
          onClick={onEdit}
          style={{ width:"100%",background:"#fff",color:"#0A2540",border:"1px solid #E2E8F0",borderRadius:10,padding:"13px",fontSize:14,cursor:"pointer",fontWeight:500 }}
        >
          Editar detalles
        </button>
        <button
          onClick={onSkip}
          style={{ background:"none",border:"none",fontSize:13,color:"#94A3B8",cursor:"pointer",textDecoration:"underline",padding:"4px" }}
        >
          Omitir por ahora
        </button>
      </div>
    </div>
  );
}
