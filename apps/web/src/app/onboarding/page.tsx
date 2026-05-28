"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { Check, ChevronRight, Upload, Plus, Trash2, Sparkles } from "lucide-react";

const PASOS = [
  { id: 1, label: "Tu agencia",   emoji: "🏢" },
  { id: 2, label: "Identidad",    emoji: "✨" },
  { id: 3, label: "Equipo",       emoji: "👥" },
  { id: 4, label: "Viajes",       emoji: "✈️" },
  { id: 5, label: "Tu página",    emoji: "🌐" },
  { id: 6, label: "¡Listo!",      emoji: "🎉" },
];

const COLORES = [
  { primary: "#5B4FE8", secondary: "#1a1a2e", label: "Púrpura" },
  { primary: "#1a56db", secondary: "#0a2e6e", label: "Azul" },
  { primary: "#1D9E75", secondary: "#064e3b", label: "Verde" },
  { primary: "#e53e3e", secondary: "#742a2a", label: "Rojo" },
  { primary: "#d97706", secondary: "#78350f", label: "Naranja" },
  { primary: "#0891b2", secondary: "#164e63", label: "Cyan" },
];

const PLANES = [
  { id: "64969ce0-8ef7-40b0-822d-f29f859dd503", nombre: "Free", precio: "S/. 0", desc: "1 viaje — para empezar", emoji: "🆓" },
  { id: "84d756be-6db1-4a20-b40f-cef6b7f61993", nombre: "Starter", precio: "S/. 99/mes", desc: "Hasta 5 viajes + IA", emoji: "🚀" },
  { id: "bc90fa9c-3af3-4d57-8f39-a6afdebc2ccd", nombre: "Pro", precio: "S/. 249/mes", desc: "Hasta 20 viajes", emoji: "⭐" },
];

const IMAGENES_VIAJE = [
  "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800",
  "https://images.unsplash.com/photo-1539650116574-75c0c6d1d1b1?w=800",
  "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
];

type MiembroEquipo = {
  nombre: string;
  rol: string;
  foto_url: string;
};

type ViajeOnboarding = {
  nombre: string;
  destino: string;
  precio: string;
  duracion: string;
  imagen_url: string;
  descripcion: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenantId, setTenantId] = useState("");

  // Paso 1 — Agencia
  const [agencia, setAgencia] = useState({
    nombre: typeof window !== "undefined" ? localStorage.getItem("totem_nombre_agencia") || "" : "",
    dominio: "",
    plan_id: "64969ce0-8ef7-40b0-822d-f29f859dd503",
    color_primario: "#5B4FE8",
    color_secundario: "#1a1a2e",
  });

  // Paso 2 — Identidad
  const [identidad, setIdentidad] = useState({
    slogan: "",
    descripcion: "",
    mision: "",
    vision: "",
    website: "",
    telefono: "",
    instagram: "",
    whatsapp: "",
  });

  // Paso 3 — Equipo
  const [equipo, setEquipo] = useState<MiembroEquipo[]>([
    { nombre: "", rol: "", foto_url: "" },
  ]);

  // Paso 4 — Viajes
  const [viajes, setViajes] = useState<ViajeOnboarding[]>([
    { nombre: "", destino: "", precio: "", duracion: "", imagen_url: IMAGENES_VIAJE[0] ?? "", descripcion: "" },
  ]);

  useEffect(() => {
    const slug = agencia.nombre.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setAgencia(p => ({ ...p, dominio: slug }));
  }, [agencia.nombre]);

  const autoSlug = (n: string) => n.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const updateEquipo = (index: number, changes: Partial<MiembroEquipo>) => {
    setEquipo(prev => prev.map((item, currentIndex) => currentIndex === index ? { ...item, ...changes } : item));
  };

  const updateViaje = (index: number, changes: Partial<ViajeOnboarding>) => {
    setViajes(prev => prev.map((item, currentIndex) => currentIndex === index ? { ...item, ...changes } : item));
  };

  const crearTenant = async () => {
    setLoading(true);
    setError("");
    try {
      if (!localStorage.getItem("totem_token")) throw new Error("No autenticado");

      const response = await requestTotemApi("/tenancy/onboarding/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agencia.nombre,
          domain: agencia.dominio || autoSlug(agencia.nombre),
          planId: agencia.plan_id,
          primaryColor: agencia.color_primario,
          secondaryColor: agencia.color_secundario,
          onboardingStep: 1,
        }),
      });
      const tenant = await response.json();
      if (!response.ok) {
        throw new Error(tenant?.error?.message ?? "No se pudo crear la empresa");
      }

      setTenantId(tenant.id);
      localStorage.setItem("totem_nombre_agencia", agencia.nombre);
      localStorage.setItem("totem_tenant_id", tenant.id);
      localStorage.setItem("totem_rol", localStorage.getItem("totem_rol") || "admin");
      return tenant.id;
    } catch (e: any) {
      setError(e.message ?? "Error al crear la empresa");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const guardarIdentidad = async (tid: string) => {
    localStorage.setItem("totem_tenant_id", tid);
    await requestTotemApi("/tenancy/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primaryColor: agencia.color_primario,
        secondaryColor: agencia.color_secundario,
        slogan: identidad.slogan,
        description: identidad.descripcion,
        website: identidad.website,
        phone: identidad.telefono,
        socialLinks: {
          instagram: identidad.instagram,
          whatsapp: identidad.whatsapp,
        },
        preferences: {
          mision: identidad.mision,
          vision: identidad.vision,
        },
        onboardingStep: 2,
      }),
    });
  };

  const crearViajes = async (tid: string) => {
    for (const v of viajes) {
      if (!v.nombre) continue;
      const slug = autoSlug(v.nombre);
      const vRes = await requestTotemApi("/trips/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: v.nombre,
          slug: slug + "-" + Date.now().toString().slice(-4),
          fecha_inicio: "2026-07-01",
          fecha_fin: "2026-07-07",
          cupos: 20,
          moneda: "PEN",
          estado: "publicado",
          configuracion: {
            tipo_viaje: "grupal",
            imagen_url: v.imagen_url,
            descripcion: v.descripcion,
            precio_base: Number(v.precio) || 0,
            descripciones_basicas: {
              titulo: v.nombre,
              subtitulo: v.destino,
              duracion: v.duracion,
              precio: `S/. ${v.precio}`,
            },
          },
        }),
      });
      const vData = await vRes.json();
      console.log('viaje creado:', vData);
    }
  };

  const handleSiguiente = async () => {
    if (paso === 1) {
      if (!agencia.nombre) { setError("Escribe el nombre de tu agencia"); return; }
      const tid = await crearTenant();
      if (!tid) return;
      setPaso(2);
    } else if (paso === 2) {
      if (tenantId) await guardarIdentidad(tenantId);
      setPaso(3);
    } else if (paso === 3) {
      setPaso(4);
    } else if (paso === 4) {
      setLoading(true);
      if (tenantId) {
        try { await crearViajes(tenantId); } catch(e) { console.error('viajes error:', e); }
      }
      setLoading(false);
      setPaso(5);
    } else if (paso === 5) {
      setPaso(6);
    } else if (paso === 6) {
      router.push("/admin");
    }
  };

  const progreso = ((paso - 1) / (PASOS.length - 1)) * 100;

  const lastAIMsg=[...messages].reverse().find(m=>m.role==="ai"&&m.chips&&m.chips.length>0);
  const activeChips=lastAIMsg?{chips:lastAIMsg.chips,msgId:lastAIMsg.id}:null;
  const lastAIMsg=[...messages].reverse().find(m=>m.role==="ai"&&m.chips&&m.chips.length>0);
  const activeChips=lastAIMsg?{chips:lastAIMsg.chips,msgId:lastAIMsg.id}:null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a1040] to-[#0a0a1a] flex flex-col items-center justify-center p-4">

      {/* Progress bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-3">
          {PASOS.map((p, i) => (
            <div key={p.id} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${i < PASOS.length - 1 ? "flex-1" : ""}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  paso > p.id ? "bg-emerald-500 text-white" :
                  paso === p.id ? "bg-[#5B4FE8] text-white scale-110 shadow-lg shadow-[#5B4FE8]/50" :
                  "bg-white/10 text-white/40"
                }`}>
                  {paso > p.id ? <Check className="w-4 h-4" /> : p.emoji}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${paso === p.id ? "text-white" : "text-white/30"}`}>
                  {p.label}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <div className="h-px flex-1 mx-2 mb-4 transition-all duration-500" style={{
                  background: paso > p.id ? "#10b981" : "rgba(255,255,255,0.1)"
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* PASO 1 — Tu agencia */}
        {paso === 1 && (
          <div>
            <div className="bg-gradient-to-r from-[#5B4FE8] to-[#7c3aed] p-8 text-white text-center">
              <div className="text-4xl mb-3">🏢</div>
              <h2 className="text-2xl font-black mb-1">¡Crea tu agencia!</h2>
              <p className="text-white/70 text-sm">En minutos tendrás tu página web lista para publicar</p>
            </div>
            <div className="p-8 space-y-5">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de tu agencia *</label>
                <input type="text" value={agencia.nombre}
                  onChange={e => setAgencia(p => ({ ...p, nombre: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:border-[#5B4FE8] transition-colors"
                  placeholder="Ej: Viajes Andinos SAC" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL de tu página</label>
                <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden focus-within:border-[#5B4FE8] transition-colors">
                  <span className="px-3 py-3 bg-gray-50 text-gray-400 text-sm">traventia.com/agencias/</span>
                  <input type="text" value={agencia.dominio}
                    onChange={e => setAgencia(p => ({ ...p, dominio: e.target.value }))}
                    className="flex-1 px-3 py-3 text-sm font-mono focus:outline-none"
                    placeholder="mi-agencia" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Color de tu marca</label>
                <div className="flex gap-3 flex-wrap">
                  {COLORES.map(c => (
                    <button key={c.primary} onClick={() => setAgencia(p => ({ ...p, color_primario: c.primary, color_secundario: c.secondary }))}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                        agencia.color_primario === c.primary ? "border-gray-800 scale-90" : "border-transparent hover:border-gray-200"
                      }`}>
                      <div className="w-8 h-8 rounded-full shadow-md" style={{ background: c.primary }} />
                      <span className="text-[10px] text-gray-500">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Plan</label>
                <div className="grid grid-cols-3 gap-3">
                  {PLANES.map(pl => (
                    <button key={pl.id} onClick={() => setAgencia(p => ({ ...p, plan_id: pl.id }))}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        agencia.plan_id === pl.id ? "border-[#5B4FE8] bg-[#5B4FE8]/5" : "border-gray-100 hover:border-gray-200"
                      }`}>
                      <div className="text-xl mb-1">{pl.emoji}</div>
                      <p className={`text-sm font-bold ${agencia.plan_id === pl.id ? "text-[#5B4FE8]" : "text-gray-800"}`}>{pl.nombre}</p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5">{pl.precio}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{pl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2 — Identidad */}
        {paso === 2 && (
          <div>
            <div className="bg-gradient-to-r from-[#7c3aed] to-[#db2777] p-8 text-white text-center">
              <div className="text-4xl mb-3">✨</div>
              <h2 className="text-2xl font-black mb-1">¿Quiénes son?</h2>
              <p className="text-white/70 text-sm">Cuéntale a tus viajeros sobre tu agencia</p>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Slogan</label>
                <input type="text" value={identidad.slogan}
                  onChange={e => setIdentidad(p => ({ ...p, slogan: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="Ej: Viajamos contigo, no por ti" maxLength={80} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción de tu agencia</label>
                <textarea value={identidad.descripcion}
                  onChange={e => setIdentidad(p => ({ ...p, descripcion: e.target.value }))}
                  rows={3} maxLength={300}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8] resize-none"
                  placeholder="¿Qué hace especial a tu agencia?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Misión</label>
                  <textarea value={identidad.mision}
                    onChange={e => setIdentidad(p => ({ ...p, mision: e.target.value }))}
                    rows={2} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8] resize-none"
                    placeholder="¿Por qué existen?" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Visión</label>
                  <textarea value={identidad.vision}
                    onChange={e => setIdentidad(p => ({ ...p, vision: e.target.value }))}
                    rows={2} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8] resize-none"
                    placeholder="¿A dónde van?" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp</label>
                  <input type="text" value={identidad.whatsapp}
                    onChange={e => setIdentidad(p => ({ ...p, whatsapp: e.target.value }))}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]"
                    placeholder="51999888777" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram</label>
                  <input type="text" value={identidad.instagram}
                    onChange={e => setIdentidad(p => ({ ...p, instagram: e.target.value }))}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]"
                    placeholder="tu_agencia" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3 — Equipo */}
        {paso === 3 && (
          <div>
            <div className="bg-gradient-to-r from-[#1D9E75] to-[#0891b2] p-8 text-white text-center">
              <div className="text-4xl mb-3">👥</div>
              <h2 className="text-2xl font-black mb-1">Tu equipo</h2>
              <p className="text-white/70 text-sm">Presenta a las personas detrás de tu agencia</p>
            </div>
            <div className="p-8 space-y-4">
              {equipo.map((m, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-600">Miembro {i + 1}</p>
                    {equipo.length > 1 && (
                      <button onClick={() => setEquipo(equipo.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={m.nombre}
                      onChange={e => updateEquipo(i, { nombre: e.target.value })}
                      className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8]"
                      placeholder="Nombre completo" />
                    <input type="text" value={m.rol}
                      onChange={e => updateEquipo(i, { rol: e.target.value })}
                      className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8]"
                      placeholder="Rol: Guía, Director..." />
                  </div>
                  <input type="text" value={m.foto_url}
                    onChange={e => updateEquipo(i, { foto_url: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8]"
                    placeholder="URL de foto (opcional)" />
                </div>
              ))}
              {equipo.length < 5 && (
                <button onClick={() => setEquipo([...equipo, { nombre: "", rol: "", foto_url: "" }])}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-[#5B4FE8] hover:text-[#5B4FE8] transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Agregar miembro
                </button>
              )}
              <p className="text-xs text-gray-400 text-center">Puedes saltarte este paso y agregar el equipo después</p>
            </div>
          </div>
        )}

        {/* PASO 4 — Viajes */}
        {paso === 4 && (
          <div>
            <div className="bg-gradient-to-r from-[#d97706] to-[#e53e3e] p-8 text-white text-center">
              <div className="text-4xl mb-3">✈️</div>
              <h2 className="text-2xl font-black mb-1">Tus viajes estrella</h2>
              <p className="text-white/70 text-sm">Agrega 2-3 viajes para mostrar en tu página</p>
            </div>
            <div className="p-8 space-y-5">
              {viajes.map((v, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl overflow-hidden">
                  <div className="relative h-28 overflow-hidden">
                    <img src={v.imagen_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2">
                      {IMAGENES_VIAJE.map((url, j) => (
                        <button key={j} onClick={() => updateViaje(i, { imagen_url: url })}
                          className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${v.imagen_url === url ? "border-white scale-110" : "border-white/30"}`}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    {viajes.length > 1 && (
                      <button onClick={() => setViajes(viajes.filter((_, j) => j !== i))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={v.nombre}
                        onChange={e => updateViaje(i, { nombre: e.target.value })}
                        className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8]"
                        placeholder="Nombre del viaje" />
                      <input type="text" value={v.destino}
                        onChange={e => updateViaje(i, { destino: e.target.value })}
                        className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8]"
                        placeholder="Destino" />
                      <input type="text" value={v.precio}
                        onChange={e => updateViaje(i, { precio: e.target.value })}
                        className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8]"
                        placeholder="Precio (S/.)" />
                      <input type="text" value={v.duracion}
                        onChange={e => updateViaje(i, { duracion: e.target.value })}
                        className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8]"
                        placeholder="Duración (ej: 5 días)" />
                    </div>
                    <textarea value={v.descripcion}
                      onChange={e => updateViaje(i, { descripcion: e.target.value })}
                      rows={2} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8] resize-none"
                      placeholder="Descripción breve del viaje..." />
                  </div>
                </div>
              ))}
              {viajes.length < 3 && (
                <button onClick={() => setViajes([...viajes, { nombre: "", destino: "", precio: "", duracion: "", imagen_url: IMAGENES_VIAJE[viajes.length % IMAGENES_VIAJE.length] ?? "", descripcion: "" }])}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-[#5B4FE8] hover:text-[#5B4FE8] transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Agregar otro viaje
                </button>
              )}
            </div>
          </div>
        )}

        {/* PASO 5 — Preview */}
        {paso === 5 && (
          <div>
            <div className="bg-gradient-to-r from-[#0891b2] to-[#5B4FE8] p-8 text-white text-center">
              <div className="text-4xl mb-3">🌐</div>
              <h2 className="text-2xl font-black mb-1">¡Tu página está lista!</h2>
              <p className="text-white/70 text-sm">Así se ve tu página pública</p>
            </div>
            <div className="p-8">
              <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-gray-300 font-mono">
                    traventia.com/agencias/{agencia.dominio}
                  </div>
                </div>
                <div className="relative h-40 overflow-hidden" style={{ background: agencia.color_secundario }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                    <h3 className="text-2xl font-black mb-1">{agencia.nombre}</h3>
                    {identidad.slogan && <p className="text-sm text-white/70">{identidad.slogan}</p>}
                    <div className="flex gap-2 mt-3">
                      <div className="px-4 py-1.5 text-xs font-bold rounded-xl text-white" style={{ background: agencia.color_primario }}>
                        Ver viajes
                      </div>
                      <div className="px-4 py-1.5 text-xs font-bold rounded-xl border border-white/30 text-white">
                        Contacto
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  {viajes.filter(v => v.nombre).slice(0,3).map((v, i) => (
                    <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                      <img src={v.imagen_url} alt="" className="w-full h-16 object-cover" />
                      <div className="p-2">
                        <p className="text-[10px] font-bold text-gray-800 truncate">{v.nombre}</p>
                        {v.precio && <p className="text-[9px] text-gray-400">S/. {v.precio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 p-4 bg-[#5B4FE8]/5 border border-[#5B4FE8]/20 rounded-2xl">
                <p className="text-sm font-semibold text-[#5B4FE8] mb-1">Tu URL pública</p>
                <p className="text-sm font-mono text-gray-700">traventia.com/agencias/<strong>{agencia.dominio}</strong></p>
                <a href={`/agencias/${agencia.dominio}`} target="_blank"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-[#5B4FE8] hover:underline">
                  Abrir en nueva pestaña →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* PASO 6 — ¡Listo! */}
        {paso === 6 && (
          <div className="text-center py-12 px-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-gray-900 mb-3">¡Felicitaciones!</h2>
            <p className="text-gray-500 mb-2">Tu agencia <strong className="text-gray-800">{agencia.nombre}</strong> está lista.</p>
            <p className="text-gray-400 text-sm mb-8">En menos de una hora construiste tu página web completa.</p>
            <div className="space-y-3 max-w-sm mx-auto">
              <a href={`/agencias/${agencia.dominio}`} target="_blank"
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white rounded-2xl hover:opacity-90 transition-all"
                style={{ background: agencia.color_primario }}>
                🌐 Ver mi página pública
              </a>
              <button onClick={() => router.push("/admin")}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-[#5B4FE8] border-2 border-[#5B4FE8]/20 rounded-2xl hover:bg-[#5B4FE8]/5 transition-all">
                Ir al panel de administración →
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-xs">
              <Sparkles className="w-3 h-3" />
              <span>Powered by Traventia</span>
            </div>
          </div>
        )}

        {/* Footer con botones */}
        {paso < 6 && (
          <div className="px-8 pb-8 flex items-center justify-between">
            {paso > 1 ? (
              <button onClick={() => setPaso(p => p - 1)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                ← Atrás
              </button>
            ) : <div />}
            <button onClick={handleSiguiente} disabled={loading}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-2xl hover:opacity-90 transition-all disabled:opacity-50"
              style={{ background: agencia.color_primario }}>
              {loading ? "Guardando..." : paso === 5 ? "¡Finalizar! 🎉" : "Siguiente"}
              {!loading && paso < 5 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
