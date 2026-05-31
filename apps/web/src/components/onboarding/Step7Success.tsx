"use client";

interface CompanyData {
  nombre: string; slogan: string; descripcion: string;
  mision: string; vision: string; email: string; telefono: string;
}

interface CreatedTrip {
  id: string; title: string; destination: string;
  status: "created" | "error";
}

interface Step7SuccessProps {
  companyData: CompanyData;
  selectedTools: string[];
  hasLanding: boolean;
  workspaceSlug: string;
  createdTrips: CreatedTrip[];
  onGoToDashboard?: () => void;
}

const TYPE_EMOJI: Record<string, string> = {
  "Machu": "🏔️", "Valle": "🗻", "Traslado": "🚐",
  "Tour": "🌎", "Playa": "🏖️", "City": "🏙️", default: "✈️",
};

function tripEmoji(title: string): string {
  for (const [k, v] of Object.entries(TYPE_EMOJI)) if (title.includes(k)) return v;
  return "✈️";
}

function CheckRow({ text, desc }: { text: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ECFDF5", border: "1px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", margin: 0 }}>{text}</p>
        <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

export function Step7Success({ companyData, selectedTools, hasLanding, workspaceSlug, createdTrips, onGoToDashboard }: Step7SuccessProps) {
  const slug = workspaceSlug || companyData.nombre.toLowerCase().replace(/\s+/g, "-").slice(0, 30) || "mi-agencia";
  const landingUrl = `traventia.com/${slug}`;
  const publishedTrips = createdTrips.filter(t => t.status === "created");

  function copyUrl() {
    navigator.clipboard.writeText(`https://${landingUrl}`).catch(() => {});
  }

  return (
    <div style={{ maxWidth: 640, margin: "20px auto", padding: "0 0 32px" }}>
      {/* Success badge */}
      <div style={{ background: "#ECFDF5", border: "1px solid #D1FAE5", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#065F46", marginBottom: 2 }}>ONBOARDING COMPLETADO</p>
          <p style={{ fontSize: 13, color: "#047857", margin: 0 }}>Tu agencia está lista para recibir clientes. Todo fue configurado exitosamente.</p>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ background: "linear-gradient(135deg,#0A2540,#1a3a5c)", borderRadius: 16, padding: 28, marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 12, animation: "pulse 2s infinite" }}>⭐</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
          ¡Felicidades, {companyData.nombre.split(" ")[0]}!
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>
          Tu cuenta está configurada y lista para recibir clientes.
        </p>
      </div>

      {/* Checklist */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "4px 20px 8px", marginBottom: 20 }}>
        <CheckRow text="Perfil configurado" desc={`${companyData.nombre} · ${companyData.slogan}`} />
        <CheckRow text="Página pública lista" desc="Tu landing está visible para clientes" />
        {publishedTrips.length > 0 && <CheckRow text={`${publishedTrips.length} viaje${publishedTrips.length > 1 ? "s" : ""} importado${publishedTrips.length > 1 ? "s" : ""}`} desc="Itinerarios creados automáticamente" />}
        {selectedTools.length > 0 && <CheckRow text={`${selectedTools.length} herramienta${selectedTools.length > 1 ? "s" : ""} conectada${selectedTools.length > 1 ? "s" : ""}`} desc={selectedTools.slice(0, 3).join(", ")} />}
        {hasLanding && <CheckRow text="Fotos de portada" desc="Tu landing tiene imágenes profesionales" />}
      </div>

      {/* Agency info */}
      <div style={{ background: "#fff", border: "1px solid #BFDBFE", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 14 }}>Configuración exitosa</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#64748B", letterSpacing: "0.05em", marginBottom: 4 }}>🔗 URL PÚBLICA</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6", margin: "0 0 6px", wordBreak: "break-all" }}>{landingUrl}</p>
            <button onClick={copyUrl} style={{ fontSize: 11, color: "#3B82F6", background: "#EFF6FF", border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>Copiar</button>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#64748B", letterSpacing: "0.05em", marginBottom: 4 }}>🏢 AGENCIA</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", margin: 0 }}>{companyData.nombre}</p>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#64748B", letterSpacing: "0.05em", marginBottom: 4 }}>🎫 VIAJES PUBLICADOS</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#10B981", margin: 0 }}>{publishedTrips.length} viaje{publishedTrips.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#64748B", letterSpacing: "0.05em", marginBottom: 4 }}>✅ SUSCRIPCIÓN</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#10B981", margin: 0 }}>Plan Pro activo</p>
          </div>
        </div>
      </div>

      {/* Created trips */}
      {publishedTrips.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0A2540", marginBottom: 12 }}>Tus viajes están listos</p>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>Estos programas ya están publicados y visibles para clientes.</p>
          <div style={{ display: "grid", gap: 12 }}>
            {publishedTrips.slice(0, 4).map(t => (
              <div key={t.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#3B82F6,#1E40AF)", padding: "18px 20px", display: "flex", alignItems: "flex-end", gap: 10, minHeight: 80 }}>
                  <span style={{ fontSize: 24, opacity: 0.9 }}>{tripEmoji(t.title)}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>{t.title}</p>
                    {t.destination && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0 }}>📍 {t.destination}</p>}
                  </div>
                </div>
                <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981", background: "#ECFDF5", padding: "3px 10px", borderRadius: 12 }}>✅ Publicado</span>
                  <button style={{ fontSize: 12, color: "#3B82F6", background: "#EFF6FF", border: "1px solid #DBEAFE", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
                    Ver detalles →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0A2540", marginBottom: 12 }}>¿Qué sigue?</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { icon: "📊", title: "Ir a mi panel", desc: "Administra viajes, clientes y reservas", cta: "Ir a panel →", primary: true, action: onGoToDashboard },
            { icon: "🌐", title: "Ver mi landing", desc: "Cómo ven tu agencia los clientes", cta: "Abrir landing", primary: false },
            { icon: "📚", title: "Tutoriales", desc: "Aprende a usar Traventia en 10 min", cta: "Ver tutoriales", primary: false },
          ].map(card => (
            <div key={card.title} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
              <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>{card.icon}</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>{card.title}</p>
              <p style={{ fontSize: 11, color: "#64748B", marginBottom: 10, lineHeight: 1.4 }}>{card.desc}</p>
              <button onClick={card.action} style={{ width: "100%", fontSize: 11, fontWeight: 600, padding: "7px 8px", borderRadius: 7, cursor: "pointer", background: card.primary ? "#0A2540" : "#fff", color: card.primary ? "#fff" : "#0A2540", border: card.primary ? "none" : "1px solid #E2E8F0" }}>
                {card.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <button onClick={onGoToDashboard} style={{ width: "100%", background: "#10B981", color: "#fff", border: "none", borderRadius: 12, padding: "17px", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 28px rgba(16,185,129,0.35)", animation: "pulse 2s infinite", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        🚀 Ir a mi panel
      </button>

      <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 12, lineHeight: 1.5 }}>
        ¡El onboarding de Traventia está completado!<br />
        Verifica la información importante antes de publicar.{" "}
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>¿Necesitas ayuda?</span>
      </p>
    </div>
  );
}
