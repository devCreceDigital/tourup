"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Step4ToolsSelector } from "@/components/onboarding/Step4ToolsSelector";
import { Step4ConfigGrid } from "@/components/onboarding/Step4ConfigGrid";
import { Step5PhotoUploader } from "@/components/onboarding/Step5PhotoUploader";
import { Step5LogoUploader } from "@/components/onboarding/Step5LogoUploader";
import { Step5LandingPreview } from "@/components/onboarding/Step5LandingPreview";
import { Step5WorkspaceConfig } from "@/components/onboarding/Step5WorkspaceConfig";
import { Step6ConversationalInput } from "@/components/onboarding/Step6ConversationalInput";
import { Step6FormFields } from "@/components/onboarding/Step6FormFields";
import { Step6TripPreview } from "@/components/onboarding/Step6TripPreview";
import { Step7FileUpload } from "@/components/onboarding/Step7FileUpload";
import { Step7Processing } from "@/components/onboarding/Step7Processing";
import { Step7ProgramDetection } from "@/components/onboarding/Step7ProgramDetection";
import { Step7Summary } from "@/components/onboarding/Step7Summary";
import { Step7Creating } from "@/components/onboarding/Step7Creating";
import { Step7Success } from "@/components/onboarding/Step7Success";
import { createAgency } from "@/lib/api/onboarding";
import { createTrip } from "@/lib/api/trips";
import { saveAgency, addTrip as storeAddTrip, addWorker, uid as storeUid } from "@/lib/store/agencyStore";
import type { AgencyData } from "@/lib/store/agencyStore";
import { parseUserInput } from "@/lib/onboarding/parseUserInput";
import { parseDocument } from "@/lib/documents/parseDocument";
import { detectFileFormat } from "@/lib/documents/types";
import type { ParsedTripData } from "@/lib/onboarding/parseUserInput";
import type { TripData } from "@/lib/onboarding/validateTrip";
import type { ConfigFields, LandingTexts, WorkspaceConfig } from "@/lib/api/onboarding";
import type { ExtractedProgram } from "@/lib/documents/types";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Message = { id: string; role: "ai" | "user"; content: string; chips: string[] };

interface CompanyData {
  nombre: string; slogan: string; descripcion: string;
  mision: string; vision: string; email: string; telefono: string;
}

const TIPOS = ["Agencia Minorista", "Operador Mayorista", "DMC / Local", "Guia Independiente", "Agencia Online", "Otro"];

/*
  Fases internas → Paso visual:
  0–1  → Paso 1  (bienvenida + tipo)
  2    → Paso 2  (formulario empresa)
  3    → Paso 3  (revisión empresa)
  4    → Paso 4  (selector herramientas)
  5    → Paso 4  (config workspace cards)
  6    → Paso 5  (fotos portada)
  7    → Paso 5  (logo)
  8    → Paso 5  (preview landing)
  9    → Paso 5  (workspace slug)
  10   → Paso 6  (conversación viaje)
  11   → Paso 6  (datos detectados)
  12   → Paso 6  (formulario viaje)
  13   → Paso 6  (preview viaje)
  14   → Paso 7  (upload documentos)
  15   → Paso 7  (procesando archivo)
  16   → Paso 7  (detección programas)
  17   → Paso 7  (resumen)
  18   → Paso 7  (creando viajes)
  19   → Paso 7  (éxito final)
*/

function getDisplayStep(phase: number): number {
  if (phase <= 1) return 1;
  if (phase === 2) return 2;
  if (phase === 3) return 3;
  if (phase <= 5) return 4;
  if (phase <= 9) return 5;
  if (phase <= 13) return 6;
  return 7;
}

const BAR_THRESHOLDS = [1, 2, 3, 4, 6, 10, 14] as const;

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Constantes de validación empresa ────────────────────────────────────────

const COMPANY_MAX: Partial<Record<keyof CompanyData, number>> = {
  nombre: 100, slogan: 150, descripcion: 500, mision: 500, vision: 500,
};

function validateCompany(c: CompanyData): Partial<Record<keyof CompanyData, string>> {
  const e: Partial<Record<keyof CompanyData, string>> = {};
  const n = (s: string) => s.trim().length;
  if (n(c.nombre) < 3) e.nombre = "Mínimo 3 caracteres";
  else if (n(c.nombre) > 100) e.nombre = "Máximo 100 caracteres";
  if (n(c.slogan) < 5) e.slogan = "Mínimo 5 caracteres";
  else if (n(c.slogan) > 150) e.slogan = "Máximo 150 caracteres";
  if (n(c.descripcion) < 10) e.descripcion = "Mínimo 10 caracteres";
  else if (n(c.descripcion) > 500) e.descripcion = "Máximo 500 caracteres";
  if (n(c.mision) < 10) e.mision = "Mínimo 10 caracteres";
  else if (n(c.mision) > 500) e.mision = "Máximo 500 caracteres";
  if (n(c.vision) < 10) e.vision = "Mínimo 10 caracteres";
  else if (n(c.vision) > 500) e.vision = "Máximo 500 caracteres";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = "Email inválido";
  if (!/^\d{7,15}$/.test(c.telefono.replace(/[\s\-\+\(\)]/g, ""))) e.telefono = "Entre 7 y 15 dígitos";
  return e;
}

const EMPTY_COMPANY: CompanyData = { nombre:"",slogan:"",descripcion:"",mision:"",vision:"",email:"",telefono:"" };

type CompanyField = { key: keyof CompanyData; label: string; type: "input" | "textarea" };
const COMPANY_FIELDS: CompanyField[] = [
  { key:"nombre",      label:"Nombre de la Agencia", type:"input"    },
  { key:"slogan",      label:"Slogan",                type:"input"    },
  { key:"descripcion", label:"Descripcion",           type:"textarea" },
  { key:"mision",      label:"Mision",                type:"textarea" },
  { key:"vision",      label:"Vision",                type:"textarea" },
  { key:"email",       label:"Email",                 type:"input"    },
  { key:"telefono",    label:"Telefono",              type:"input"    },
];

const DEFAULT_LANDING_TEXTS: LandingTexts = {
  serviceName1: "Viajes Exclusivos",
  serviceDesc1: "Experiencias personalizadas",
  serviceName2: "Hoteles Premium",
  serviceDesc2: "Alojamiento de lujo",
  ctaText: "Contactar por WhatsApp",
};

const DEFAULT_WORKSPACE: WorkspaceConfig = {
  slug: "", isSubscriptionActive: true, isPublic: true, emailNotifications: true,
};

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = { width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#0A2540",boxSizing:"border-box" };
const fieldStyle: React.CSSProperties = { background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16 };
const labelStyle: React.CSSProperties = { display:"block",fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:8 };

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function AIAvatar() {
  return (
    <div style={{ width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#0A2540,#1a3a5c)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(10,37,64,0.3)" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16EFFF" strokeWidth="2.5">
        <path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </div>
  );
}

function Chip({ label, onClick, primary, magenta }: { label: string; onClick: () => void; primary?: boolean; magenta?: boolean }) {
  if (magenta) return <button onClick={onClick} style={{ background:"#D946EF",border:"none",borderRadius:14,padding:"14px 40px",fontSize:15,color:"#fff",cursor:"pointer",fontWeight:600,boxShadow:"0 4px 24px rgba(217,70,239,0.25)" }}>{label}</button>;
  if (primary) return <button onClick={onClick} style={{ background:"#0A2540",border:"none",borderRadius:14,padding:"14px 40px",fontSize:15,color:"#fff",cursor:"pointer",fontWeight:600,boxShadow:"0 4px 24px rgba(10,37,64,0.18)" }}>{label}</button>;
  return <button onClick={onClick} style={{ background:"#fff",border:"1px solid #CBD5E1",borderRadius:20,padding:"8px 18px",fontSize:13,color:"#0A2540",cursor:"pointer" }}>{label}</button>;
}

function CompanyForm({ onSubmit, initialData }: { onSubmit: (d: CompanyData) => void; initialData: CompanyData | null }) {
  const [c, setC] = useState<CompanyData>(initialData ?? EMPTY_COMPANY);
  const [touched, setTouched] = useState<Set<keyof CompanyData>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const errors = validateCompany(c);
  const hasErrors = Object.keys(errors).length > 0;
  const touch = (key: keyof CompanyData) => setTouched(prev => { const s = new Set(prev); s.add(key); return s; });
  const fieldError = (key: keyof CompanyData) => (touched.has(key) || submitted) ? errors[key] : undefined;

  return (
    <div style={{ maxWidth:640,margin:"0 auto",padding:"20px" }}>
      <h2 style={{ fontSize:18,fontWeight:600,color:"#0A2540",marginBottom:20 }}>Informacion de tu Agencia</h2>
      <div style={{ display:"grid",gap:16 }}>
        {COMPANY_FIELDS.map(({ key, label, type }) => {
          const err = fieldError(key);
          const max = COMPANY_MAX[key];
          const len = c[key].length;
          return (
            <div key={key} style={fieldStyle}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                <label style={{ ...labelStyle, marginBottom:0 }}>{label}</label>
                {max && len > 0 && (
                  <span style={{ fontSize:11,color:len>max?"#EF4444":len>max*0.85?"#F59E0B":"#94A3B8" }}>{len}/{max}</span>
                )}
              </div>
              {type === "textarea"
                ? <textarea value={c[key]} onChange={e => setC({ ...c, [key]: e.target.value })} onBlur={() => touch(key)} maxLength={max} style={{ ...inputStyle,minHeight:80,fontFamily:"inherit",resize:"vertical",borderColor:err?"#EF4444":"#E2E8F0",marginTop:8 }} />
                : <input
                    type={key === "email" ? "email" : key === "telefono" ? "tel" : "text"}
                    value={c[key]}
                    onChange={e => {
                      let v = e.target.value;
                      if (key === "telefono") v = v.replace(/[^\d\s\-\+\(\)]/g, "");
                      if (max && v.length > max) return;
                      setC({ ...c, [key]: v });
                    }}
                    onBlur={() => touch(key)}
                    style={{ ...inputStyle, borderColor:err?"#EF4444":"#E2E8F0", marginTop:8 }}
                  />
              }
              {err && <p style={{ fontSize:11,color:"#EF4444",marginTop:5,marginBottom:0 }}>{err}</p>}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => { setSubmitted(true); if (!hasErrors) onSubmit(c); }}
        disabled={submitted && hasErrors}
        style={{ width:"100%",marginTop:24,background:submitted&&hasErrors?"#EEF2F7":"#0A2540",color:submitted&&hasErrors?"#94A3B8":"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:600,cursor:submitted&&hasErrors?"default":"pointer" }}
      >
        Confirmar Agencia
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <div style={{ width:20,height:20,borderRadius:"50%",background:"#16EFFF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
  );
}

function SuccessScreen({ companyData, selectedTools, hasLanding, hasTripPublished, tripTitle }: { companyData: CompanyData; selectedTools: string[]; hasLanding: boolean; hasTripPublished: boolean; tripTitle?: string }) {
  const items = [
    { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>, title:"Pagina publica creada", desc:`${companyData.nombre} · ${companyData.slogan}` },
    ...(selectedTools.length > 0 ? [{ icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, title:`${selectedTools.length} herramienta${selectedTools.length > 1 ? "s" : ""} conectada${selectedTools.length > 1 ? "s" : ""}`, desc:selectedTools.slice(0, 3).join(", ") + (selectedTools.length > 3 ? " y más" : "") }] : []),
    ...(hasLanding ? [{ icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, title:"Landing configurada", desc:"Tu pagina de presentacion esta lista" }] : []),
    ...(hasTripPublished ? [{ icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, title:"Primer viaje publicado", desc:tripTitle ?? "Tu viaje ya está disponible para reservas" }] : []),
    { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title:"Pipeline de reservas listo", desc:"Recibe y gestiona solicitudes desde el dashboard" },
  ];

  return (
    <div style={{ maxWidth:640,margin:"20px auto",padding:"0 16px" }}>
      <div style={{ background:"linear-gradient(135deg,#0A2540,#1a3a5c)",borderRadius:16,padding:32,textAlign:"center",marginBottom:24 }}>
        <div style={{ width:64,height:64,borderRadius:"50%",background:"rgba(22,239,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16EFFF" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize:22,fontWeight:700,color:"#fff",marginBottom:8 }}>Todo listo, {companyData.nombre.split(" ")[0]}!</h2>
        <p style={{ fontSize:14,color:"rgba(255,255,255,0.7)",lineHeight:1.6,margin:0 }}>Tu cuenta esta configurada y lista para recibir clientes.</p>
      </div>
      <div style={{ display:"grid",gap:12,marginBottom:24 }}>
        {items.map((item, i) => (
          <div key={i} style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:"#EEF2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              {item.icon}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2 }}>{item.title}</p>
              <p style={{ fontSize:12,color:"#64748B",margin:0 }}>{item.desc}</p>
            </div>
            <CheckIcon />
          </div>
        ))}
      </div>
      <button style={{ width:"100%",background:"#0A2540",color:"#fff",border:"none",borderRadius:12,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 24px rgba(10,37,64,0.25)" }}>
        Ir al Dashboard →
      </button>
      <p style={{ textAlign:"center",fontSize:12,color:"#94A3B8",marginTop:12 }}>Tu agencia ya esta en el sistema. Puedes completar el resto desde el dashboard.</p>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages]   = useState<Message[]>([]);
  const [phase, setPhase]         = useState(0);
  const [input, setInput]         = useState("");
  const [agencyType, setAgencyType] = useState("");

  // Paso 2–3
  const [showForm, setShowForm]         = useState(false);
  const [companyData, setCompanyData]   = useState<CompanyData | null>(null);

  // Paso 4
  const [showToolForm, setShowToolForm]         = useState(false);
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [selectedTools, setSelectedTools]       = useState<string[]>([]);
  const [configFields, setConfigFields]         = useState<ConfigFields>({ contactos:[],empresas:[],negocios:[],tickets:[] });

  // Paso 5
  const [showPhotoForm, setShowPhotoForm]           = useState(false);
  const [showLogoForm, setShowLogoForm]             = useState(false);
  const [showLandingPreview, setShowLandingPreview] = useState(false);
  const [showWorkspaceConfig, setShowWorkspaceConfig] = useState(false);
  const [landingPhotos, setLandingPhotos]           = useState<string[]>(["","","",""]);
  const [logo, setLogo]                             = useState("");
  const [landingTexts, setLandingTexts]             = useState<LandingTexts>(DEFAULT_LANDING_TEXTS);
  const [workspaceConfig, setWorkspaceConfig]       = useState<WorkspaceConfig>(DEFAULT_WORKSPACE);
  const [submitting, setSubmitting]                 = useState(false);

  // Paso 6 — Viaje
  const [showTripChat, setShowTripChat]       = useState(false);
  const [showTripForm, setShowTripForm]       = useState(false);
  const [tripUserInput, setTripUserInput]     = useState("");
  const [showTripView, setShowTripView]       = useState(false);
  const [parsedTrip, setParsedTrip]           = useState<ParsedTripData>({});
  const [tripData, setTripData]               = useState<TripData | null>(null);
  const [hasTripPublished, setHasTripPublished] = useState(false);

  // Step 7
  const [uploadedFile, setUploadedFile]               = useState<File | null>(null);
  const [extractedPrograms, setExtractedPrograms]     = useState<ExtractedProgram[]>([]);
  const [selectedPrograms, setSelectedPrograms]       = useState<ExtractedProgram[]>([]);
  const [step7CreatedTrips, setStep7CreatedTrips]     = useState<Array<{ id: string; title: string; destination: string; status: "created" | "error" }>>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showForm, showToolForm, showWorkspaceForm, showPhotoForm, showLogoForm, showLandingPreview, showWorkspaceConfig, showTripChat, showTripForm, showTripView, phase, extractedPrograms, selectedPrograms]);

  useEffect(() => {
    const t = setTimeout(() => pushAI(
      "Hola. Soy el asistente de activacion de TOUR UP.\n\nEn menos de 3 minutos voy a dejarte listo:\n\n• Pagina publica para recibir clientes\n• Landing con tus fotos y logo\n• Primer viaje publicado\n• Estructura completa de tu agencia\n\nSolo necesito conocerte un poco.",
      ["Empecemos"]
    ), 300);
    return () => clearTimeout(t);
  }, []);

  function pushAI(content: string, chips: string[]) {
    setMessages(prev => [...prev, { id: uid(), role: "ai", content, chips }]);
  }
  function pushUser(content: string) {
    setMessages(prev => [...prev, { id: uid(), role: "user", content, chips: [] }]);
  }

  function handleChip(chip: string) {
    pushUser(chip);
    if (phase === 0) {
      setPhase(1);
      pushAI("Como describes mejor tu operacion de viajes?", TIPOS);
    } else if (phase === 1) {
      setAgencyType(chip);
      setPhase(2);
      setShowForm(true);
      pushAI("Detecte que operas como " + chip + ". Ahora necesito los datos de tu agencia para crear tu pagina publica.", []);
    }
  }

  // Paso 2 → 3
  function handleCompanySubmit(company: CompanyData) {
    setCompanyData(company);
    setShowForm(false);
    setPhase(3);
  }

  // Paso 3 → 4.1
  function handleReviewConfirm() {
    setPhase(4);
    setShowToolForm(true);
    pushAI(
      "Perfecto, " + (companyData?.nombre.split(" ")[0] ?? "") + "! Tu agencia esta configurada.\n\nAhora conectemos las herramientas que ya usas para gestionarlo todo desde un solo lugar.",
      []
    );
  }

  // Paso 4.1 → 4.2
  function handleToolSubmit(tools: string[]) {
    setSelectedTools(tools);
    setShowToolForm(false);
    setPhase(5);
    setShowWorkspaceForm(true);
    const msg = tools.length > 0
      ? `Genial! Integre ${tools.slice(0, 3).join(", ")}${tools.length > 3 ? " y mas" : ""} a tu cuenta.\n\nAhora selecciona los campos de tu espacio de trabajo.`
      : "Puedes conectar herramientas mas tarde.\n\nSelecciona los campos de tu espacio de trabajo.";
    pushAI(msg, []);
  }

  // Paso 4.2 → 5.1
  function handleConfigConfirm(fields: ConfigFields) {
    setConfigFields(fields);
    setShowWorkspaceForm(false);
    setPhase(6);
    setShowPhotoForm(true);
    pushAI(
      "¡Se ve genial! Ahora seleccionemos las fotos de portada para tu landing.\n\nEstas imagenes inspiraran confianza a tus viajeros y mostraran la calidad de tus servicios.",
      []
    );
  }

  // Paso 4.2 → 4.1 (back)
  function handleConfigBack() {
    setShowWorkspaceForm(false);
    setPhase(4);
    setShowToolForm(true);
  }

  // Paso 5.1 → 5.2
  function handlePhotosNext() {
    setShowPhotoForm(false);
    setPhase(7);
    setShowLogoForm(true);
    pushAI("Perfecto. Ahora necesitamos el logo de tu agencia. Aparecera en toda tu landing y comunicaciones.", []);
  }

  function handlePhotosSkip() {
    setLandingPhotos(["","","",""]);
    setShowPhotoForm(false);
    setPhase(7);
    setShowLogoForm(true);
    pushAI("Sin problema. Puedes agregar fotos desde el dashboard.\n\nAhora sube el logo de tu agencia.", []);
  }

  // Paso 5.2 → 5.3
  function handleLogoNext() {
    setShowLogoForm(false);
    setPhase(8);
    setShowLandingPreview(true);
    pushAI("¡Excelente! Aqui esta como se veria tu landing con estas imagenes:", []);
  }

  function handleLogoSkip() {
    setLogo("");
    setShowLogoForm(false);
    setPhase(8);
    setShowLandingPreview(true);
    pushAI("Puedes agregar tu logo despues.\n\nMira como quedaria tu landing:", []);
  }

  // Paso 5.3 → 5.4
  function handleLandingConfirm() {
    setShowLandingPreview(false);
    setPhase(9);
    setShowWorkspaceConfig(true);
    pushAI("Casi listo. Configuremos la URL y los detalles finales de tu espacio en TOUR UP.", []);
  }

  function handleLandingSkip() {
    setShowLandingPreview(false);
    setPhase(9);
    setShowWorkspaceConfig(true);
    pushAI("Puedes editar el landing desde el dashboard.\n\nDefinamos la URL de tu agencia.", []);
  }

  // Paso 5.4 → 6.1
  async function handleWorkspaceSubmit() {
    if (!companyData) return;
    setSubmitting(true);
    try {
      await createAgency({
        agencyType,
        company: companyData,
        selectedTools,
        configFields,
        landingPhotos: landingPhotos.filter(p => p !== ""),
        logo,
        landingTexts,
        workspaceConfig,
      });
    } catch {
      // Mock fallback: continúa aunque falle la API
    }
    setSubmitting(false);
    setShowWorkspaceConfig(false);
    setPhase(10);
    setShowTripChat(true);
    pushAI(
      "¡Excelente! Tu agencia ya esta configurada.\n\nAhora vamos a crear tu primer viaje. Cuéntame qué tipo de experiencia quieres ofrecer. Puedes describir el destino, duración, tipo de viajeros, actividades... ¡Todo lo que tengas en mente!",
      []
    );
  }

  function handleWorkspaceSkip() {
    setShowWorkspaceConfig(false);
    setPhase(10);
    setShowTripChat(true);
    pushAI(
      "Puedes completar la URL desde el dashboard.\n\nAhora creemos tu primer viaje. Cuéntame qué experiencia quieres ofrecer a tus clientes.",
      []
    );
  }

  // Paso 6.1 → 6.2 (directo al formulario pre-llenado)
  function handleTripInputSubmit(userInput: string) {
    pushUser(userInput);
    const parsed = parseUserInput(userInput);
    setParsedTrip(parsed);
    setTripUserInput(userInput);
    setShowTripChat(false);
    setPhase(12);
    setShowTripForm(true);
    pushAI(
      "¡Perfecto! Aquí está lo que capturé de tu descripción. Completa los campos que falten para terminar los detalles de tu viaje.",
      []
    );
  }

  // Paso 6.3 → 6.4
  function handleTripFormSubmit(data: TripData) {
    setTripData(data);
    setShowTripForm(false);
    setPhase(13);
    setShowTripView(true);
    pushAI(
      "¡Fantástico! Aquí está tu primer viaje. Esto es lo que tus clientes verán cuando busquen experiencias en tu agencia.",
      []
    );
  }

  // Paso 6.4 → 7.1 (publicar)
  async function handleTripPublish() {
    if (!tripData) return;
    setSubmitting(true);
    try {
      await createTrip(tripData);
    } catch {
      // Mock fallback
    }
    setSubmitting(false);
    setHasTripPublished(true);
    setShowTripView(false);
    setPhase(14);
    pushAI(
      "¡Tu primer viaje está publicado!\n\nAhora vamos al último paso: puedo importar todos tus itinerarios desde PDF, Excel, Word o tu blog de notas para cargar tu catálogo completo en segundos.",
      []
    );
  }

  // Paso 6.4 → 7.1 (omitir)
  function handleTripSkip() {
    setShowTripView(false);
    setPhase(14);
    pushAI(
      "Sin problema.\n\nAhora vamos al último paso: puedo importar todos tus itinerarios desde PDF, Excel, Word o tu blog de notas (Notion, Obsidian, etc.).",
      []
    );
  }

  // ── Step 7 handlers ──────────────────────────────────────────────────────────

  async function handleFileSelected(file: File) {
    setUploadedFile(file);
    setPhase(15);
    try {
      const programs = await parseDocument(file);
      setExtractedPrograms(programs);
      setSelectedPrograms(programs);
    } catch {
      setExtractedPrograms([]);
      setSelectedPrograms([]);
    }
    setPhase(16);
    pushAI(
      `✅ ANÁLISIS COMPLETADO\n\nDetecté ${extractedPrograms.length || 3} programas en el documento. Selecciona los que deseas incluir y edita si necesitas ajustar algún dato.`,
      []
    );
  }

  function handleProgramsSelected(selected: ExtractedProgram[]) {
    setSelectedPrograms(selected);
    setPhase(17);
    pushAI(
      "¡Perfecto! Aquí está el resumen de lo que extraje. Estos itinerarios se convertirán en tus viajes publicables. Si ves algo que necesita ajuste, puedes editar directamente.",
      []
    );
  }

  function handleCreateTrips() {
    setPhase(18);
  }

  function handleCreatingComplete(results: Array<{ id: string; title: string; destination: string; status: "created" | "error" }>) {
    setStep7CreatedTrips(results);
    setPhase(19);
    pushAI(
      "¡Felicidades! 🎉 Tu espacio de trabajo está completamente configurado. He creado tus viajes automáticamente. Ahora puedes comenzar a recibir clientes y administrar tus reservas desde el panel.",
      []
    );
  }

  function handleStep7Skip() {
    setPhase(19);
    pushAI("Puedes importar tus itinerarios en cualquier momento desde el panel. ¡Tu agencia ya está lista!", []);
  }

  function handleStep7CreateManually() {
    setShowTripView(false);
    setPhase(10);
    setShowTripChat(true);
    pushAI("Cuéntame qué tipo de experiencia quieres ofrecer. Describe el destino, duración, tipo de viajeros, actividades...", []);
  }

  // ── Ir al dashboard: guarda todo en el store y navega ────────────────────

  function handleGoToDashboard() {
    if (!companyData) { router.push("/dashboard/agency"); return; }

    const slug = workspaceConfig.slug || companyData.nombre.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "")
      .trim().replace(/\s+/g, "-").slice(0, 50);

    const agency: AgencyData = {
      id: storeUid(),
      slug,
      agencyType,
      nombre: companyData.nombre,
      slogan: companyData.slogan,
      descripcion: companyData.descripcion,
      mision: companyData.mision,
      vision: companyData.vision,
      email: companyData.email,
      telefono: companyData.telefono,
      logo,
      landingPhotos,
      landingTexts,
      selectedTools,
      isPublic: workspaceConfig.isPublic,
      emailNotifications: workspaceConfig.emailNotifications,
      subscriptionPlan: "Pro",
      createdAt: new Date().toISOString(),
    };
    saveAgency(agency);

    // Agregar el viaje del Step 6 si fue publicado
    if (hasTripPublished && tripData) {
      storeAddTrip({
        title: tripData.title,
        description: tripData.description,
        destination: tripData.destinationMain,
        dateStart: tripData.startDate,
        dateEnd: "",
        durationDays: tripData.durationDays,
        priceFrom: tripData.priceFrom,
        priceTo: tripData.priceTo,
        currency: tripData.currency,
        activities: tripData.activities,
        includes: tripData.includes,
        travelerTypes: tripData.travelerTypes,
        maxCapacity: tripData.maxCapacity,
        type: tripData.type,
        status: "published",
      });
    }

    // Agregar trips del Step 7 con datos completos de selectedPrograms
    if (step7CreatedTrips.length > 0 && selectedPrograms.length > 0) {
      for (const program of selectedPrograms) {
        const wasCreated = step7CreatedTrips.some(ct => ct.title === program.title && ct.status === "created");
        if (wasCreated) {
          storeAddTrip({
            title: program.title,
            description: program.description,
            destination: program.destination,
            dateStart: program.dateStart,
            dateEnd: program.dateEnd,
            durationDays: program.durationDays,
            priceFrom: program.priceFrom,
            priceTo: program.priceTo,
            currency: program.currency,
            activities: program.activities,
            includes: program.includes,
            travelerTypes: program.travelerTypes,
            maxCapacity: program.maxCapacity,
            type: program.type,
            status: "published",
          });
        }
      }
    }

    // Agregar owner como primer trabajador
    addWorker({
      name: companyData.nombre,
      email: companyData.email,
      role: "owner",
      status: "active",
    });

    router.push("/dashboard/agency");
  }

  const lastAIMsg = [...messages].reverse().find(m => m.role === "ai" && m.chips.length > 0);
  const activeChips = lastAIMsg?.chips ?? [];
  const step = getDisplayStep(phase);

  return (
    <div style={{ minHeight:"100vh",background:"#F7F8FA",fontFamily:"Inter,-apple-system,sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html:"@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} .msg-in{animation:fadeUp 0.35s ease forwards} @media(max-width:600px){.workspace-grid{grid-template-columns:1fr!important}.tool-grid{grid-template-columns:1fr!important}}" }} />

      {/* Header */}
      <div style={{ position:"sticky",top:0,zIndex:20,background:"rgba(247,248,250,0.96)",borderBottom:"1px solid #E2E8F0",padding:"14px 24px" }}>
        <div style={{ maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:8,height:8,borderRadius:"50%",background:"#16EFFF",boxShadow:"0 0 8px #16EFFF" }} />
            <span style={{ fontSize:15,fontWeight:600,color:"#0A2540" }}>TOUR UP</span>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            {phase > 0 && (
              <span style={{ fontSize:12,color:"#64748B",fontWeight:500 }}>Paso {step} de 7</span>
            )}
            <div style={{ display:"flex",gap:5 }}>
              {BAR_THRESHOLDS.map((threshold, i) => (
                <div key={i} style={{ width:20,height:4,borderRadius:2,background:phase>=threshold?"#0A2540":"#E2E8F0",transition:"background 0.3s" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat + formularios */}
      <div style={{ maxWidth:640,margin:"0 auto",padding:"32px 16px 160px" }}>
        {messages.map(msg => (
          <div key={msg.id} className="msg-in" style={{ display:"flex",gap:12,marginBottom:12,justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-start" }}>
            {msg.role === "ai" && <AIAvatar />}
            <div style={{ background:msg.role==="ai"?"#fff":"#0A2540",border:msg.role==="ai"?"1px solid #E2E8F0":"none",borderRadius:msg.role==="ai"?"0 18px 18px 18px":"18px 0 18px 18px",padding:"14px 18px",fontSize:14,color:msg.role==="ai"?"#1a2e45":"#fff",maxWidth:500,whiteSpace:"pre-line",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",lineHeight:1.6 }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Paso 2: Formulario empresa */}
        {showForm && <CompanyForm onSubmit={handleCompanySubmit} initialData={companyData} />}

        {/* Paso 3: Revisión empresa */}
        {phase === 3 && companyData && !showForm && (
          <div style={{ maxWidth:640,margin:"20px auto",background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:20 }}>
            <h3 style={{ fontSize:16,fontWeight:600,color:"#0A2540",marginBottom:4 }}>La informacion de tu agencia</h3>
            <p style={{ fontSize:13,color:"#64748B",marginBottom:16 }}>Confirma que todo esta correcto antes de continuar.</p>
            <div style={{ background:"#F7F8FA",borderRadius:8,padding:16,marginBottom:16,display:"grid",gap:12 }}>
              {(["nombre","slogan","descripcion","mision","vision"] as const).map(k => (
                <div key={k}>
                  <p style={{ fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2,textTransform:"capitalize" }}>{k}</p>
                  <p style={{ fontSize:13,color:"#1a2e45",margin:0 }}>{companyData[k]}</p>
                </div>
              ))}
            </div>
            <div style={{ background:"#F7F8FA",borderRadius:8,padding:16,marginBottom:16,display:"grid",gap:12 }}>
              <div><p style={{ fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2 }}>Email</p><p style={{ fontSize:13,color:"#1a2e45",margin:0 }}>{companyData.email}</p></div>
              <div><p style={{ fontSize:13,fontWeight:600,color:"#0A2540",marginBottom:2 }}>Telefono</p><p style={{ fontSize:13,color:"#1a2e45",margin:0 }}>{companyData.telefono}</p></div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={() => setShowForm(true)} style={{ flex:"0 0 auto",background:"#fff",border:"1px solid #E2E8F0",borderRadius:6,padding:"10px 16px",cursor:"pointer",fontSize:13,color:"#0A2540",fontWeight:600 }}>
                Editar
              </button>
              <button onClick={handleReviewConfirm} style={{ flex:1,background:"#D946EF",color:"#fff",border:"none",borderRadius:6,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:600 }}>
                Si, parece correcto
              </button>
            </div>
          </div>
        )}

        {/* Paso 4.1: Selector de herramientas */}
        {showToolForm && (
          <div className="tool-grid">
            <Step4ToolsSelector initialSelected={selectedTools} onSubmit={handleToolSubmit} />
          </div>
        )}

        {/* Paso 4.2: Config workspace */}
        {showWorkspaceForm && (
          <div className="workspace-grid">
            <Step4ConfigGrid onConfirm={handleConfigConfirm} onBack={handleConfigBack} />
          </div>
        )}

        {/* Paso 5.1: Fotos portada */}
        {showPhotoForm && (
          <Step5PhotoUploader
            photos={landingPhotos}
            onPhotosChange={setLandingPhotos}
            onNext={handlePhotosNext}
            onSkip={handlePhotosSkip}
          />
        )}

        {/* Paso 5.2: Logo */}
        {showLogoForm && (
          <Step5LogoUploader
            logo={logo}
            onLogoChange={setLogo}
            onNext={handleLogoNext}
            onSkip={handleLogoSkip}
          />
        )}

        {/* Paso 5.3: Preview landing */}
        {showLandingPreview && companyData && (
          <Step5LandingPreview
            photos={landingPhotos}
            logo={logo}
            agencyName={companyData.nombre}
            slogan={companyData.slogan}
            landingTexts={landingTexts}
            onLandingTextsChange={setLandingTexts}
            onConfirm={handleLandingConfirm}
            onSkip={handleLandingSkip}
          />
        )}

        {/* Paso 5.4: Workspace config */}
        {showWorkspaceConfig && companyData && (
          <Step5WorkspaceConfig
            agencyName={companyData.nombre}
            config={workspaceConfig}
            onChange={setWorkspaceConfig}
            onSubmit={handleWorkspaceSubmit}
            onBack={() => { setShowWorkspaceConfig(false); setPhase(8); setShowLandingPreview(true); }}
            onSkip={handleWorkspaceSkip}
            loading={submitting}
          />
        )}

        {/* Paso 6.1: Conversación viaje */}
        {showTripChat && (
          <Step6ConversationalInput onSubmit={handleTripInputSubmit} />
        )}

        {/* Paso 6.2: Formulario viaje pre-llenado */}
        {showTripForm && (
          <Step6FormFields
            initialData={parsedTrip}
            userInput={tripUserInput}
            onSubmit={handleTripFormSubmit}
            onSkip={() => { setShowTripForm(false); setPhase(14); pushAI("Sin problema. Puedes crear viajes desde el panel cuando estés listo.", []); }}
          />
        )}

        {/* Paso 6.4: Preview viaje */}
        {showTripView && tripData && (
          <Step6TripPreview
            tripData={tripData}
            onPublish={handleTripPublish}
            onEdit={() => { setShowTripView(false); setPhase(12); setShowTripForm(true); }}
            onSkip={handleTripSkip}
            loading={submitting}
          />
        )}

        {/* Paso 7.1: Upload documentos */}
        {phase === 14 && (
          <Step7FileUpload
            onFileSelected={handleFileSelected}
            onCreateManually={handleStep7CreateManually}
            onSkip={handleStep7Skip}
          />
        )}

        {/* Paso 7.2: Procesando archivo */}
        {phase === 15 && uploadedFile && (
          <Step7Processing
            fileName={uploadedFile.name}
            fileSize={uploadedFile.size}
            detectedFormat={detectFileFormat(uploadedFile)}
          />
        )}

        {/* Paso 7.3: Detección de programas */}
        {phase === 16 && (
          <Step7ProgramDetection
            programs={extractedPrograms}
            fileName={uploadedFile?.name ?? "documento"}
            onContinue={handleProgramsSelected}
            onUploadNew={() => setPhase(14)}
          />
        )}

        {/* Paso 7.4: Resumen */}
        {phase === 17 && (
          <Step7Summary
            programs={selectedPrograms}
            fileName={uploadedFile?.name ?? "documento"}
            onCreateTrips={handleCreateTrips}
            onEdit={() => setPhase(16)}
            onSkip={handleStep7Skip}
          />
        )}

        {/* Paso 7.5: Creando viajes */}
        {phase === 18 && (
          <Step7Creating
            programs={selectedPrograms}
            onComplete={handleCreatingComplete}
          />
        )}

        {/* Paso 7.6: Éxito final */}
        {phase === 19 && companyData && (
          <Step7Success
            companyData={companyData}
            selectedTools={selectedTools}
            hasLanding={landingPhotos.some(p => p !== "") || logo !== ""}
            workspaceSlug={workspaceConfig.slug}
            createdTrips={step7CreatedTrips}
            onGoToDashboard={handleGoToDashboard}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Barra inferior con chips e input */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:"rgba(247,248,250,0.96)",borderTop:"1px solid #E2E8F0",padding:"12px 16px 20px" }}>
        <div style={{ maxWidth:640,margin:"0 auto" }}>
          {activeChips.length > 0 && phase < 10 && phase < 14 && !showForm && !showToolForm && !showWorkspaceForm && !showPhotoForm && !showLogoForm && !showLandingPreview && !showWorkspaceConfig && (
            <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:12,justifyContent:activeChips.length===1?"center":"flex-start" }}>
              {activeChips.map(chip => (
                <Chip
                  key={chip}
                  label={chip}
                  primary={activeChips.length === 1}
                  onClick={() => handleChip(chip)}
                />
              ))}
            </div>
          )}
          {phase < 10 && phase < 14 && (
            <div style={{ background:"#fff",border:"1px solid #E2E8F0",borderRadius:24,padding:"10px 14px",display:"flex",gap:10,boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Responde aqui..."
                style={{ flex:1,border:"none",outline:"none",fontSize:14,color:"#0A2540",background:"transparent" }}
              />
              <button
                disabled={!input.trim()}
                style={{ width:32,height:32,borderRadius:"50%",background:input.trim()?"#0A2540":"#EEF2F7",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={input.trim()?"#16EFFF":"#94A3B8"}><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
