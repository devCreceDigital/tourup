"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStore } from "@/lib/store/agencyStore";
import type { AgencyData, Trip } from "@/lib/store/agencyStore";

// ─── Tipos internos ────────────────────────────────────────────────────────

interface SlugParams {
  params: { slug: string };
}

const TYPE_EMOJI: Record<string, string> = {
  Aventura: "🧗", Playa: "🏖️", Cultural: "🏛️", Lujo: "💎",
  Negocios: "💼", Familiar: "👨‍👩‍👧", Grupos: "👥", Otro: "✈️",
};

// ─── Componente principal ──────────────────────────────────────────────────

export default function AgencyLanding({ params }: SlugParams) {
  const router = useRouter();
  const { slug } = params;
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    const store = loadStore();
    if (store.agency && store.agency.slug === slug) {
      setAgency(store.agency);
      setTrips(store.trips.filter((t) => t.status === "published"));
    }
    setLoaded(true);
  }, [slug]);

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F8FA", fontFamily: "Inter,-apple-system,sans-serif" }}>
        <p style={{ color: "#64748B" }}>Cargando...</p>
      </div>
    );
  }

  if (!agency) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A2540", fontFamily: "Inter,-apple-system,sans-serif" }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>✈️</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 12px" }}>404</h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 28 }}>
            La agencia <strong>{slug}</strong> no fue encontrada.
          </p>
          <button
            onClick={() => router.push("/")}
            style={{ background: "#D946EF", color: "#fff", border: "none", borderRadius: 12, padding: "13px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          >
            Ir a Traventia
          </button>
        </div>
      </div>
    );
  }

  const heroPhoto = agency.landingPhotos.find((p) => p !== "");
  const galleryPhotos = agency.landingPhotos.filter((p) => p !== "");

  const navLinks = ["Inicio", "Viajes", "Nosotros", "Contacto"];

  return (
    <div style={{ fontFamily: "Inter,-apple-system,sans-serif", background: "#fff" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes fade-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}" }} />

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,37,64,0.97)", backdropFilter: "blur(12px)", padding: "0 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {agency.logo ? (
              <img src={agency.logo} alt="Logo" style={{ height: 36, width: 36, objectFit: "contain", borderRadius: 8 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#D946EF,#16EFFF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{agency.nombre.slice(0, 1).toUpperCase()}</span>
              </div>
            )}
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{agency.nombre}</span>
          </div>
          {/* Links */}
          <div style={{ display: "flex", gap: 4 }}>
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => setActiveSection(link.toLowerCase())}
                style={{ padding: "8px 16px", background: "transparent", border: "none", color: activeSection === link.toLowerCase() ? "#16EFFF" : "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 8, transition: "color 0.15s" }}
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        id="inicio"
        style={{
          position: "relative", minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: heroPhoto ? `url(${heroPhoto}) center/cover no-repeat` : "linear-gradient(135deg,#0A2540 0%,#1a3a5c 50%,#0A2540 100%)",
          overflow: "hidden",
        }}
      >
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,37,64,0.65)" }} />
        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 24px", maxWidth: 760, animation: "fade-in 0.8s ease forwards" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(22,239,255,0.15)", border: "1px solid rgba(22,239,255,0.3)", borderRadius: 20, padding: "5px 14px", marginBottom: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#16EFFF", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#16EFFF" }}>{agency.agencyType}</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.1 }}>
            {agency.nombre}
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", margin: "0 0 36px", lineHeight: 1.5 }}>
            {agency.slogan}
          </p>
          <button
            style={{ background: "#D946EF", color: "#fff", border: "none", borderRadius: 14, padding: "16px 40px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 32px rgba(217,70,239,0.4)" }}
          >
            {agency.landingTexts.ctaText}
          </button>
        </div>
        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: "pulse 2s infinite" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </section>

      {/* ── ACERCA DE ── */}
      <section id="nosotros" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#D946EF", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Acerca de nosotros</p>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0A2540", margin: "0 0 16px" }}>¿Quiénes somos?</h2>
            <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
              {agency.descripcion}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: "linear-gradient(135deg,#F7F8FA,#fff)", border: "1px solid #E2E8F0", borderRadius: 16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16EFFF" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0A2540", margin: "0 0 8px" }}>Nuestra Misión</h3>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: 0 }}>{agency.mision}</p>
            </div>
            <div style={{ background: "linear-gradient(135deg,#F7F8FA,#fff)", border: "1px solid #E2E8F0", borderRadius: 16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#D946EF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0A2540", margin: "0 0 8px" }}>Nuestra Visión</h3>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: 0 }}>{agency.vision}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section style={{ padding: "80px 24px", background: "#F7F8FA" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#D946EF", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Lo que ofrecemos</p>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0A2540", margin: 0 }}>Nuestros servicios</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              { name: agency.landingTexts.serviceName1, desc: agency.landingTexts.serviceDesc1, icon: "✈️" },
              { name: agency.landingTexts.serviceName2, desc: agency.landingTexts.serviceDesc2, icon: "🏨" },
            ].map((service, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{service.icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: "#0A2540", margin: "0 0 10px" }}>{service.name}</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: 0 }}>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIAJES DISPONIBLES ── */}
      {trips.length > 0 && (
        <section id="viajes" style={{ padding: "80px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1060, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#D946EF", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Catálogo</p>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0A2540", margin: 0 }}>Viajes disponibles</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
              {trips.map((trip) => {
                const emoji = TYPE_EMOJI[trip.type] ?? "✈️";
                return (
                  <div key={trip.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s" }}>
                    <div style={{ background: "linear-gradient(135deg,#0A2540,#1a3a5c)", padding: "28px 20px 20px", minHeight: 100, position: "relative" }}>
                      <span style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.9 }}>{emoji}</span>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.3 }}>{trip.title}</h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0 }}>📍 {trip.destination}</p>
                    </div>
                    <div style={{ padding: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 2px" }}>Desde</p>
                          <p style={{ fontSize: 20, fontWeight: 800, color: "#0A2540", margin: 0 }}>
                            {trip.currency} {trip.priceFrom.toLocaleString()}
                          </p>
                        </div>
                        {trip.durationDays > 0 && (
                          <div style={{ background: "#EEF2F7", borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: "#0A2540", margin: 0 }}>{trip.durationDays}</p>
                            <p style={{ fontSize: 10, color: "#64748B", margin: 0 }}>días</p>
                          </div>
                        )}
                      </div>
                      {trip.activities.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                          {trip.activities.slice(0, 3).map((a) => (
                            <span key={a} style={{ fontSize: 11, background: "#F1F5F9", color: "#475569", padding: "3px 9px", borderRadius: 8 }}>{a}</span>
                          ))}
                          {trip.activities.length > 3 && (
                            <span style={{ fontSize: 11, background: "#F1F5F9", color: "#94A3B8", padding: "3px 9px", borderRadius: 8 }}>+{trip.activities.length - 3}</span>
                          )}
                        </div>
                      )}
                      <button
                        style={{ width: "100%", padding: "10px", background: "#F7F8FA", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#0A2540", cursor: "pointer" }}
                      >
                        Ver detalles →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── GALERÍA ── */}
      {galleryPhotos.length > 0 && (
        <section style={{ padding: "80px 24px", background: "#F7F8FA" }}>
          <div style={{ maxWidth: 1060, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#D946EF", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Galería</p>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0A2540", margin: 0 }}>Nuestros momentos</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
              {galleryPhotos.map((photo, i) => (
                <div key={i} style={{ aspectRatio: "4/3", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  <img src={photo} alt={`Galería ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACTO ── */}
      <section id="contacto" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#D946EF", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Contacto</p>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0A2540", margin: "0 0 12px" }}>¡Hablemos!</h2>
          <p style={{ fontSize: 16, color: "#64748B", margin: "0 0 32px", lineHeight: 1.6 }}>
            Estamos listos para crear tu próxima aventura. Contáctanos y te asesoramos sin costo.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7F8FA", borderRadius: 10, padding: "12px 20px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D946EF" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span style={{ fontSize: 14, color: "#0A2540", fontWeight: 500 }}>{agency.email}</span>
            </div>
            {agency.telefono && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7F8FA", borderRadius: 10, padding: "12px 20px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D946EF" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.78h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.79-.79a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 17c0 .04.01.08.01.12z"/></svg>
                <span style={{ fontSize: 14, color: "#0A2540", fontWeight: 500 }}>{agency.telefono}</span>
              </div>
            )}
          </div>
          {/* CTA WhatsApp / Email */}
          <a
            href={agency.telefono ? `https://wa.me/${agency.telefono.replace(/\D/g, "")}` : `mailto:${agency.email}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#D946EF", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "16px 40px", fontSize: 16, fontWeight: 700, boxShadow: "0 8px 32px rgba(217,70,239,0.35)" }}
          >
            {agency.telefono ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Contactar por WhatsApp
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Enviar email
              </>
            )}
          </a>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(135deg,#D946EF,#7C3AED)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 14px" }}>¿Listo para tu próxima aventura?</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", margin: "0 0 32px", lineHeight: 1.6 }}>
            Diseñamos viajes únicos adaptados a tus sueños y presupuesto.
          </p>
          <button
            style={{ background: "#fff", color: "#D946EF", border: "none", borderRadius: 14, padding: "15px 40px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
          >
            {agency.landingTexts.ctaText}
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0A2540", padding: "40px 24px 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {agency.logo ? (
                  <img src={agency.logo} alt="Logo" style={{ height: 28, width: 28, objectFit: "contain", borderRadius: 6 }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#D946EF,#16EFFF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{agency.nombre.slice(0, 1).toUpperCase()}</span>
                  </div>
                )}
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{agency.nombre}</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>Powered by Traventia</p>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0 }}>{agency.email}</p>
              </div>
              {agency.telefono && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Teléfono</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0 }}>{agency.telefono}</p>
                </div>
              )}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              © {new Date().getFullYear()} {agency.nombre}. Todos los derechos reservados.
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Powered by{" "}
              <span style={{ color: "#16EFFF", fontWeight: 600 }}>Traventia</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
