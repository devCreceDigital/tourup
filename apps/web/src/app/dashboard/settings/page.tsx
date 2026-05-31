"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAgency, saveAgency } from "@/lib/store/agencyStore";
import type { AgencyData } from "@/lib/store/agencyStore";

// ─── Tipos ─────────────────────────────────────────────────────────────────

type Tab = "perfil" | "landing" | "notificaciones" | "plan";

interface ProfileForm {
  nombre: string;
  slogan: string;
  descripcion: string;
  mision: string;
  vision: string;
  email: string;
  telefono: string;
  agencyType: string;
}

interface LandingForm {
  serviceName1: string;
  serviceDesc1: string;
  serviceName2: string;
  serviceDesc2: string;
  ctaText: string;
}

// ─── Validación ────────────────────────────────────────────────────────────

function validateProfile(f: ProfileForm): Partial<Record<keyof ProfileForm, string>> {
  const e: Partial<Record<keyof ProfileForm, string>> = {};
  if (f.nombre.trim().length < 3) e.nombre = "Mínimo 3 caracteres";
  if (f.slogan.trim().length < 5) e.slogan = "Mínimo 5 caracteres";
  if (f.descripcion.trim().length < 10) e.descripcion = "Mínimo 10 caracteres";
  if (f.mision.trim().length < 10) e.mision = "Mínimo 10 caracteres";
  if (f.vision.trim().length < 10) e.vision = "Mínimo 10 caracteres";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Email inválido";
  if (!/^\d{7,15}$/.test(f.telefono.replace(/[\s\-+()]/g, ""))) e.telefono = "Entre 7 y 15 dígitos";
  return e;
}

// ─── Estilos ───────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid #E2E8F0", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#0A2540",
  boxSizing: "border-box", background: "#fff",
};

const AGENCY_TYPES = ["Agencia Minorista", "Operador Mayorista", "DMC / Local", "Guia Independiente", "Agencia Online", "Otro"];

// ─── Componente principal ──────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [tab, setTab] = useState<Tab>("perfil");
  const [saved, setSaved] = useState(false);

  // Perfil
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    nombre: "", slogan: "", descripcion: "", mision: "", vision: "",
    email: "", telefono: "", agencyType: "",
  });
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const [profileTouched, setProfileTouched] = useState<Set<keyof ProfileForm>>(new Set());

  // Landing
  const [landingForm, setLandingForm] = useState<LandingForm>({
    serviceName1: "", serviceDesc1: "", serviceName2: "", serviceDesc2: "", ctaText: "",
  });

  // Notificaciones
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [showDirectory, setShowDirectory] = useState(false);

  useEffect(() => {
    const a = getAgency();
    if (a) {
      setAgency(a);
      setProfileForm({
        nombre: a.nombre, slogan: a.slogan, descripcion: a.descripcion,
        mision: a.mision, vision: a.vision, email: a.email,
        telefono: a.telefono, agencyType: a.agencyType,
      });
      setLandingForm({
        serviceName1: a.landingTexts.serviceName1,
        serviceDesc1: a.landingTexts.serviceDesc1,
        serviceName2: a.landingTexts.serviceName2,
        serviceDesc2: a.landingTexts.serviceDesc2,
        ctaText: a.landingTexts.ctaText,
      });
      setEmailNotifications(a.emailNotifications);
      setIsPublic(a.isPublic);
    }
  }, []);

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleProfileSave() {
    setProfileTouched(new Set(Object.keys(profileForm) as (keyof ProfileForm)[]));
    const errors = validateProfile(profileForm);
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!agency) return;
    const updated: AgencyData = {
      ...agency,
      nombre: profileForm.nombre,
      slogan: profileForm.slogan,
      descripcion: profileForm.descripcion,
      mision: profileForm.mision,
      vision: profileForm.vision,
      email: profileForm.email,
      telefono: profileForm.telefono,
      agencyType: profileForm.agencyType,
    };
    saveAgency(updated);
    setAgency(updated);
    showSaved();
  }

  function handleLandingSave() {
    if (!agency) return;
    const updated: AgencyData = {
      ...agency,
      landingTexts: { ...landingForm },
    };
    saveAgency(updated);
    setAgency(updated);
    showSaved();
  }

  function handleNotifSave() {
    if (!agency) return;
    const updated: AgencyData = { ...agency, emailNotifications, isPublic };
    saveAgency(updated);
    setAgency(updated);
    showSaved();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "perfil", label: "Perfil" },
    { id: "landing", label: "Landing" },
    { id: "notificaciones", label: "Notificaciones" },
    { id: "plan", label: "Plan" },
  ];

  if (!agency) {
    return (
      <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#64748B" }}>No hay agencia configurada.</p>
        <button onClick={() => router.push("/onboarding")} style={{ marginTop: 16, background: "#D946EF", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Ir al onboarding
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0A2540", margin: 0 }}>Configuración</h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>Gestiona todos los ajustes de tu agencia</p>
      </div>

      {/* Toast */}
      {saved && (
        <div style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#15803D", fontSize: 16 }}>✓</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>Cambios guardados correctamente</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "#F1F5F9", borderRadius: 12, padding: 4, marginBottom: 28 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#0A2540" : "#64748B", boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB PERFIL */}
      {tab === "perfil" && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0A2540", margin: "0 0 20px" }}>Perfil de la agencia</h2>
          <div style={{ display: "grid", gap: 16 }}>
            <ProfileField label="Nombre de la agencia *" error={profileTouched.has("nombre") ? profileErrors.nombre : undefined}>
              <input style={{ ...inputStyle, borderColor: (profileTouched.has("nombre") && profileErrors.nombre) ? "#EF4444" : "#E2E8F0" }} value={profileForm.nombre} onChange={(e) => setProfileForm((f) => ({ ...f, nombre: e.target.value }))} onBlur={() => setProfileTouched((s) => new Set([...s, "nombre"]))} />
            </ProfileField>
            <ProfileField label="Slogan *" error={profileTouched.has("slogan") ? profileErrors.slogan : undefined}>
              <input style={{ ...inputStyle, borderColor: (profileTouched.has("slogan") && profileErrors.slogan) ? "#EF4444" : "#E2E8F0" }} value={profileForm.slogan} onChange={(e) => setProfileForm((f) => ({ ...f, slogan: e.target.value }))} onBlur={() => setProfileTouched((s) => new Set([...s, "slogan"]))} />
            </ProfileField>
            <ProfileField label="Descripción *" error={profileTouched.has("descripcion") ? profileErrors.descripcion : undefined}>
              <textarea style={{ ...inputStyle, minHeight: 80, fontFamily: "inherit", resize: "vertical", borderColor: (profileTouched.has("descripcion") && profileErrors.descripcion) ? "#EF4444" : "#E2E8F0" }} value={profileForm.descripcion} onChange={(e) => setProfileForm((f) => ({ ...f, descripcion: e.target.value }))} onBlur={() => setProfileTouched((s) => new Set([...s, "descripcion"]))} />
            </ProfileField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <ProfileField label="Misión *" error={profileTouched.has("mision") ? profileErrors.mision : undefined}>
                <textarea style={{ ...inputStyle, minHeight: 70, fontFamily: "inherit", resize: "vertical", borderColor: (profileTouched.has("mision") && profileErrors.mision) ? "#EF4444" : "#E2E8F0" }} value={profileForm.mision} onChange={(e) => setProfileForm((f) => ({ ...f, mision: e.target.value }))} onBlur={() => setProfileTouched((s) => new Set([...s, "mision"]))} />
              </ProfileField>
              <ProfileField label="Visión *" error={profileTouched.has("vision") ? profileErrors.vision : undefined}>
                <textarea style={{ ...inputStyle, minHeight: 70, fontFamily: "inherit", resize: "vertical", borderColor: (profileTouched.has("vision") && profileErrors.vision) ? "#EF4444" : "#E2E8F0" }} value={profileForm.vision} onChange={(e) => setProfileForm((f) => ({ ...f, vision: e.target.value }))} onBlur={() => setProfileTouched((s) => new Set([...s, "vision"]))} />
              </ProfileField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <ProfileField label="Email *" error={profileTouched.has("email") ? profileErrors.email : undefined}>
                <input type="email" style={{ ...inputStyle, borderColor: (profileTouched.has("email") && profileErrors.email) ? "#EF4444" : "#E2E8F0" }} value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} onBlur={() => setProfileTouched((s) => new Set([...s, "email"]))} />
              </ProfileField>
              <ProfileField label="Teléfono *" error={profileTouched.has("telefono") ? profileErrors.telefono : undefined}>
                <input type="tel" style={{ ...inputStyle, borderColor: (profileTouched.has("telefono") && profileErrors.telefono) ? "#EF4444" : "#E2E8F0" }} value={profileForm.telefono} onChange={(e) => setProfileForm((f) => ({ ...f, telefono: e.target.value }))} onBlur={() => setProfileTouched((s) => new Set([...s, "telefono"]))} />
              </ProfileField>
            </div>
            <ProfileField label="Tipo de agencia">
              <select style={inputStyle} value={profileForm.agencyType} onChange={(e) => setProfileForm((f) => ({ ...f, agencyType: e.target.value }))}>
                {AGENCY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </ProfileField>
          </div>
          <button onClick={handleProfileSave} style={{ marginTop: 22, background: "#0A2540", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Guardar cambios
          </button>
        </div>
      )}

      {/* TAB LANDING */}
      {tab === "landing" && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0A2540", margin: "0 0 6px" }}>Landing pública</h2>
          <div style={{ background: "#F7F8FA", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 2px", fontWeight: 600, textTransform: "uppercase" }}>URL pública</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#3B82F6", margin: 0 }}>traventia.com/{agency.slug}</p>
            </div>
            <button onClick={() => window.open(`/${agency.slug}`, "_blank")} style={{ background: "#0A2540", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Ver landing
            </button>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <ProfileField label="Nombre servicio 1">
                <input style={inputStyle} value={landingForm.serviceName1} onChange={(e) => setLandingForm((f) => ({ ...f, serviceName1: e.target.value }))} placeholder="Ej: Viajes Exclusivos" />
              </ProfileField>
              <ProfileField label="Descripción servicio 1">
                <input style={inputStyle} value={landingForm.serviceDesc1} onChange={(e) => setLandingForm((f) => ({ ...f, serviceDesc1: e.target.value }))} placeholder="Ej: Experiencias personalizadas" />
              </ProfileField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <ProfileField label="Nombre servicio 2">
                <input style={inputStyle} value={landingForm.serviceName2} onChange={(e) => setLandingForm((f) => ({ ...f, serviceName2: e.target.value }))} placeholder="Ej: Hoteles Premium" />
              </ProfileField>
              <ProfileField label="Descripción servicio 2">
                <input style={inputStyle} value={landingForm.serviceDesc2} onChange={(e) => setLandingForm((f) => ({ ...f, serviceDesc2: e.target.value }))} placeholder="Ej: Alojamiento de lujo" />
              </ProfileField>
            </div>
            <ProfileField label="Texto del botón CTA">
              <input style={inputStyle} value={landingForm.ctaText} onChange={(e) => setLandingForm((f) => ({ ...f, ctaText: e.target.value }))} placeholder="Ej: Contactar por WhatsApp" />
            </ProfileField>
          </div>

          {/* Fotos */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", margin: "0 0 12px" }}>Fotos de portada</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {Array.from({ length: 4 }, (_, i) => {
                const photo = agency.landingPhotos[i];
                return (
                  <div key={i} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "2px dashed #E2E8F0", background: "#F7F8FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {photo ? (
                      <img src={photo} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 24, opacity: 0.4 }}>📷</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>Para cambiar las fotos, regresa al onboarding o contacta soporte.</p>
          </div>

          <button onClick={handleLandingSave} style={{ marginTop: 22, background: "#0A2540", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Guardar
          </button>
        </div>
      )}

      {/* TAB NOTIFICACIONES */}
      {tab === "notificaciones" && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0A2540", margin: "0 0 20px" }}>Notificaciones y visibilidad</h2>
          <div style={{ display: "grid", gap: 16 }}>
            <ToggleRow
              label="Notificaciones por email"
              desc="Recibe alertas de reservas y mensajes en tu correo"
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
            <ToggleRow
              label="Agencia pública"
              desc="Tu landing es visible para todos los visitantes"
              checked={isPublic}
              onChange={setIsPublic}
            />
            <ToggleRow
              label="Mostrar en directorio"
              desc="Aparecer en el directorio de agencias de Traventia"
              checked={showDirectory}
              onChange={setShowDirectory}
            />
          </div>
          <button onClick={handleNotifSave} style={{ marginTop: 24, background: "#0A2540", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Guardar
          </button>
        </div>
      )}

      {/* TAB PLAN */}
      {tab === "plan" && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0A2540", margin: "0 0 20px" }}>Plan activo</h2>
          <div style={{ background: "linear-gradient(135deg,#0A2540,#1a3a5c)", borderRadius: 14, padding: 24, marginBottom: 20, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#16EFFF", letterSpacing: "0.1em", marginBottom: 4 }}>PLAN ACTUAL</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>Pro</div>
              </div>
              <div style={{ background: "rgba(22,239,255,0.15)", border: "1px solid rgba(22,239,255,0.3)", borderRadius: 20, padding: "4px 14px" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#16EFFF" }}>Activo</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                "Landing pública personalizada",
                "Viajes ilimitados",
                "Hasta 5 trabajadores",
                "Importación de itinerarios PDF",
                "Pipeline de reservas",
                "Soporte prioritario",
              ].map((feature) => (
                <div key={feature} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16EFFF" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <button disabled style={{ background: "#F1F5F9", color: "#94A3B8", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "not-allowed" }}>
            Cambiar plan — Próximamente
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function ProfileField({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>{label}</label>
      {children}
      {error != null && <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #E2E8F0", borderRadius: 10, gap: 16 }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: "#64748B", margin: "3px 0 0" }}>{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: checked ? "#0A2540" : "#E2E8F0", position: "relative", flexShrink: 0, transition: "background 0.2s" }}
      >
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  );
}
