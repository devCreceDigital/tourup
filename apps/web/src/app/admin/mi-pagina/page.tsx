"use client";
import { useEffect, useState, useRef } from "react";
import { Save, Eye, EyeOff, Palette, Type, Phone, Globe, Check, Upload, Link } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { getCurrentProfile, persistProfileSession } from "@/shared/api/profile";

interface Config {
  logo_url: string; banner_url: string; slogan: string; descripcion: string;
  color_primario: string; color_secundario: string; website: string;
  telefono: string; dominio_custom: string;
  redes_sociales: { instagram?: string; facebook?: string; whatsapp?: string; tiktok?: string };
}

type ViajeTenantPreview = {
  readonly id: string;
  readonly slug?: string;
  readonly nombre: string;
  readonly moneda?: "PEN" | "USD" | string;
  readonly estado?: string;
  readonly configuracion?: {
    readonly imagen_url?: string;
    readonly precios_detalle?: readonly { readonly monto?: number; readonly destacado?: boolean }[];
  };
};

const BANNERS = [
  "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1600",
  "https://images.unsplash.com/photo-1539650116574-75c0c6d1d1b1?w=1600",
  "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600",
];

const COLORES = [
  { primary: "#5B4FE8", secondary: "#1a1a2e", label: "Púrpura" },
  { primary: "#1a56db", secondary: "#0a2e6e", label: "Azul" },
  { primary: "#1D9E75", secondary: "#064e3b", label: "Verde" },
  { primary: "#e53e3e", secondary: "#742a2a", label: "Rojo" },
  { primary: "#d97706", secondary: "#78350f", label: "Naranja" },
  { primary: "#0891b2", secondary: "#164e63", label: "Cyan" },
  { primary: "#7c3aed", secondary: "#2e1065", label: "Violeta" },
  { primary: "#db2777", secondary: "#831843", label: "Rosa" },
];

export default function MiPaginaPage() {
  const [config, setConfig] = useState<Config>({
    logo_url: "", banner_url: BANNERS[0] ?? "", slogan: "", descripcion: "",
    color_primario: "#5B4FE8", color_secundario: "#1a1a2e",
    website: "", telefono: "", dominio_custom: "",
    redes_sociales: { instagram: "", facebook: "", whatsapp: "", tiktok: "" }
  });
  const [dominio, setDominio]   = useState("");
  const [nombre, setNombre]     = useState("");
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [viajes, setViajes]       = useState<ViajeTenantPreview[]>([]);
  const [cardStyle, setCardStyle]   = useState<'clasica'|'grande'|'horizontal'|'spotlight'>('clasica');
  const [activeTab, setActiveTab] = useState<"diseno"|"contenido"|"contacto"|"dominio">("diseno");
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    getCurrentProfile()
      .then(async me => {
        if (me === null) return;
        persistProfileSession(me);
        setTenantId(me.tenantId ?? "");
        // nombre se carga desde el tenant
        if (me.tenantId) {
          const res = await requestTotemApi("/tenancy/preferences");
          if (res.ok) {
            const d = await res.json();
            setDominio(d.domain ?? "");
            setNombre(d.name ?? "");
            requestTotemApi("/trips/").then(r => r.json()).then(dv => setViajes(Array.isArray(dv) ? dv : dv.results ?? []));
            setConfig(prev => ({
              ...prev,
              logo_url:        d.logoUrl ?? "",
              banner_url:      d.bannerUrl || BANNERS[0],
              slogan:          d.slogan ?? "",
              descripcion:     d.description ?? "",
              color_primario:  d.primaryColor ?? "#5B4FE8",
              color_secundario:d.secondaryColor ?? "#1a1a2e",
              website:         d.website ?? "",
              telefono:        d.phone ?? "",
              dominio_custom:  d.customDomain ?? "",
              redes_sociales:  d.socialLinks ?? {},
            }));
            setCardStyle(d.preferences?.preferences?.card_style ?? d.preferences?.card_style ?? 'clasica');
            setConfig(prev => ({
              ...prev,
            }));
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
    await requestTotemApi("/tenancy/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logoUrl: config.logo_url || null,
        primaryColor: config.color_primario,
        secondaryColor: config.color_secundario,
        description: config.descripcion,
        website: config.website,
        phone: config.telefono,
        slogan: config.slogan,
        socialLinks: config.redes_sociales,
        preferences: { card_style: cardStyle, bannerUrl: config.banner_url, customDomain: config.dominio_custom },
        onboardingStep: 100,
      }),
    });
    } catch(e) { console.error("Error guardando:", e); }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const cp = config.color_primario;
  const cs = config.color_secundario;

  const TABS = [
    { id: "diseno",    label: "Diseño",    icon: Palette },
    { id: "contenido", label: "Contenido", icon: Type },
    { id: "contacto",  label: "Contacto",  icon: Phone },
    { id: "dominio",   label: "Dominio",   icon: Globe },
  ] as const;

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#5B4FE8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0edf8]">
      {/* Panel izquierdo — controles */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-[#ede9f8] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#ede9f8]">
          <h1 className="font-bold text-gray-900">Mi página</h1>
          <p className="text-xs text-gray-400 mt-0.5">Edita y ve los cambios en vivo</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#ede9f8]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                activeTab === id ? "text-[#5B4FE8] border-b-2 border-[#5B4FE8]" : "text-gray-400 hover:text-gray-600"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Contenido del tab */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* DISEÑO */}
          {activeTab === "diseno" && (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3">Imagen de fondo</p>
                <div className="grid grid-cols-3 gap-2">
                  {BANNERS.map((url, i) => (
                    <button key={i} onClick={() => setConfig(p => ({ ...p, banner_url: url }))}
                      className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        config.banner_url === url ? "border-[#5B4FE8] scale-95" : "border-transparent hover:border-gray-300"
                      }`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {config.banner_url === url && (
                        <div className="absolute inset-0 bg-[#5B4FE8]/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <input type="text" value={config.banner_url}
                  onChange={e => setConfig(p => ({ ...p, banner_url: e.target.value }))}
                  className="mt-2 w-full border border-[#ede9f8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="O pega tu URL de imagen..." />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3">Paleta de colores</p>
                <div className="grid grid-cols-4 gap-2">
                  {COLORES.map(({ primary, secondary, label }) => (
                    <button key={primary} onClick={() => setConfig(p => ({ ...p, color_primario: primary, color_secundario: secondary }))}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                        config.color_primario === primary ? "border-gray-800 scale-95" : "border-transparent hover:border-gray-200"
                      }`}>
                      <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ background: primary }} />
                      <span className="text-[9px] text-gray-500">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Logo (URL)</p>
                <input type="text" value={config.logo_url}
                  onChange={e => setConfig(p => ({ ...p, logo_url: e.target.value }))}
                  className="w-full border border-[#ede9f8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="https://tu-logo.com/logo.png" />
                {config.logo_url && (
                  <img src={config.logo_url} alt="logo" className="mt-2 h-8 object-contain" />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3">Estilo de cards de viajes</p>
                <div className="space-y-2">
                  {([
                    { id: "clasica", label: "Clásica", desc: "Imagen arriba, info abajo", preview: "📷 ─── 📝" },
                    { id: "grande", label: "Imagen grande", desc: "Foto completa con texto encima", preview: "🖼️ con texto" },
                    { id: "spotlight", label: "Spotlight", desc: "1 card grande + 2 pequeñas", preview: "⭐ Destacado" },
                  ] as const).map(({ id, label, desc, preview }) => (
                    <button key={id} onClick={() => setCardStyle(id)}
                      className={"w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all " + (cardStyle === id ? "border-[#5B4FE8] bg-[#5B4FE8]/5" : "border-[#ede9f8] hover:border-gray-300")}>
                      <span className="text-lg">{preview}</span>
                      <div>
                        <p className={"text-xs font-semibold " + (cardStyle === id ? "text-[#5B4FE8]" : "text-gray-700")}>{label}</p>
                        <p className="text-[10px] text-gray-400">{desc}</p>
                      </div>
                      {cardStyle === id && <span className="ml-auto text-[#5B4FE8] text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CONTENIDO */}
          {activeTab === "contenido" && (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Nombre de la agencia</p>
                <div className="w-full border border-[#ede9f8] rounded-lg px-3 py-2 text-sm bg-gray-50 font-semibold text-gray-700">
                  {nombre || dominio || "Tu agencia"}
                  <span className="text-[10px] font-normal text-gray-400 ml-2">(se edita en configuración)</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Slogan</p>
                <input type="text" value={config.slogan}
                  onChange={e => setConfig(p => ({ ...p, slogan: e.target.value }))}
                  className="w-full border border-[#ede9f8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="Frase que inspire a viajar..." maxLength={80} />
                <p className="text-[10px] text-gray-400 mt-1 text-right">{config.slogan.length}/80</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Sobre tu agencia</p>
                <textarea value={config.descripcion}
                  onChange={e => setConfig(p => ({ ...p, descripcion: e.target.value }))}
                  rows={5} maxLength={300}
                  className="w-full border border-[#ede9f8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4FE8] resize-none"
                  placeholder="Cuéntale a tus viajeros quiénes son..." />
                <p className="text-[10px] text-gray-400 text-right">{config.descripcion.length}/300</p>
              </div>
            </>
          )}

          {/* CONTACTO */}
          {activeTab === "contacto" && (
            <>
              {[
                { label: "WhatsApp", key: "whatsapp", placeholder: "51999888777", hint: "Solo números, con código de país" },
                { label: "Instagram", key: "instagram", placeholder: "tu_agencia", hint: "Sin @" },
                { label: "TikTok", key: "tiktok", placeholder: "tu_agencia", hint: "Sin @" },
                { label: "Facebook", key: "facebook", placeholder: "tu-agencia", hint: "Nombre de página" },
              ].map(({ label, key, placeholder, hint }) => (
                <div key={key}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                  <input type="text"
                    value={config.redes_sociales[key as keyof Config["redes_sociales"]] ?? ""}
                    onChange={e => setConfig(p => ({ ...p, redes_sociales: { ...p.redes_sociales, [key]: e.target.value } }))}
                    className="w-full border border-[#ede9f8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4FE8]"
                    placeholder={placeholder} />
                  <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Teléfono</p>
                <input type="text" value={config.telefono}
                  onChange={e => setConfig(p => ({ ...p, telefono: e.target.value }))}
                  className="w-full border border-[#ede9f8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="+51 999 888 777" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Website</p>
                <input type="text" value={config.website}
                  onChange={e => setConfig(p => ({ ...p, website: e.target.value }))}
                  className="w-full border border-[#ede9f8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="https://tu-agencia.com" />
              </div>
            </>
          )}

          {/* DOMINIO */}
          {activeTab === "dominio" && (
            <>
              <div className="bg-[#5B4FE8]/5 border border-[#5B4FE8]/20 rounded-xl p-4">
                <p className="text-xs font-bold text-[#5B4FE8] mb-1">Tu URL en Traventia</p>
                <p className="text-sm font-mono text-gray-700 break-all">
                  traventia.com/agencias/<strong>{dominio || "tu-agencia"}</strong>
                </p>
                {dominio && (
                  <a href={`/agencias/${dominio}`} target="_blank"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[#5B4FE8] hover:underline">
                    <Eye className="w-3 h-3" /> Ver página
                  </a>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-1">Dominio propio</p>
                <p className="text-xs text-amber-600 mb-3">Si tienes tu propio dominio, configura un registro CNAME apuntando a <strong>traventia.com</strong></p>
                <input type="text" value={config.dominio_custom}
                  onChange={e => setConfig(p => ({ ...p, dominio_custom: e.target.value }))}
                  className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  placeholder="mi-agencia.com" />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-gray-600">Pasos para conectar tu dominio:</p>
                {["Compra tu dominio (GoDaddy, Namecheap, etc.)", "Agrega un registro CNAME: www → traventia.com", "Escribe tu dominio arriba y guarda", "Espera 24-48h para propagación DNS"].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5B4FE8]/10 text-[#5B4FE8] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    <p className="text-xs text-gray-500">{step}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer — guardar */}
        <div className="p-4 border-t border-[#ede9f8]">
          <button onClick={handleSave} disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
              saved ? "bg-emerald-500 text-white" : "bg-[#5B4FE8] text-white hover:bg-[#4a3fd4]"
            } disabled:opacity-50`}>
            {saved ? <><Check className="w-4 h-4" /> ¡Guardado!</> : saving ? "Guardando..." : <><Save className="w-4 h-4" /> Publicar cambios</>}
          </button>
        </div>
      </div>

      {/* Preview en vivo */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-[#ede9f8] px-4 py-2 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg px-3 py-1 text-xs text-gray-500 font-mono">
            traventia.com/agencias/{dominio || "tu-agencia"}
          </div>
          {dominio && (
            <a href={`/agencias/${dominio}`} target="_blank"
              className="text-xs text-[#5B4FE8] hover:underline flex items-center gap-1">
              <Link className="w-3 h-3" /> Abrir
            </a>
          )}
        </div>

        {/* Mini preview de la landing */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero preview */}
          <div className="relative h-64 overflow-hidden" style={{ background: cs }}>
            {config.banner_url && (
              <>
                <img src={config.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${cs}dd, ${cs}88)` }} />
              </>
            )}
            <div className="relative z-10 p-8 text-white">
              {config.logo_url ? (
                <img src={config.logo_url} alt="" className="h-8 object-contain mb-3" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs mb-3" style={{ background: cp }}>
                  {(nombre || "A")[0]}
                </div>
              )}
              <h1 className="text-2xl font-black">{nombre || dominio || "Tu agencia"}</h1>
              {config.slogan && <p className="text-sm text-white/80 mt-1">{config.slogan}</p>}
              <div className="flex gap-2 mt-4">
                <div className="px-4 py-2 text-xs font-bold rounded-lg text-white" style={{ background: cp }}>Ver viajes</div>
                <div className="px-4 py-2 text-xs font-bold rounded-lg border border-white/30 text-white">Contacto</div>
              </div>
            </div>
          </div>

          {/* Descripcion preview */}
          {config.descripcion && (
            <div className="p-6 bg-white border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: cp }}>Sobre nosotros</p>
              <p className="text-sm text-gray-600 leading-relaxed">{config.descripcion}</p>
            </div>
          )}

          {/* Viajes reales */}
          <div className="p-6 bg-[#f8f7ff]">
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: cp }}>Nuestros viajes</p>
            <div className={cardStyle === 'spotlight' ? 'grid grid-cols-3 gap-3 auto-rows-auto' : 'grid grid-cols-3 gap-3'}>
              {viajes.length === 0 ? (
                <p className="text-xs text-gray-400 col-span-3 text-center py-4">Sin viajes publicados aún</p>
              ) : viajes.slice(0, 3).map((v, idx) => {
                const img = v.configuracion?.imagen_url || "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400";
                const precioBase = v.configuracion?.precios_detalle?.[0]?.monto;
                const precio = precioBase !== undefined ? `${v.moneda === "PEN" ? "S/. " : "$ "}${precioBase}` : "";
                if (cardStyle === "grande") return (
                  <div key={v.id} className="relative rounded-xl overflow-hidden shadow-sm h-32">
                    <img src={img} alt={v.nombre} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-bold truncate">{v.nombre}</p>
                      {precio && <p className="text-white/80 text-[10px]">{precio}</p>}
                    </div>
                  </div>
                );
                if (cardStyle === "spotlight") {
                  if (idx === 0) return (
                    <div key={v.id} className="row-span-2 relative rounded-xl overflow-hidden shadow-sm h-full min-h-[160px]">
                      <img src={img} alt={v.nombre} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-bold truncate">{v.nombre}</p>
                        {precio && <p className="text-white/70 text-[10px]">{precio}</p>}
                        <div className="mt-1 w-full h-5 text-[10px] font-bold rounded text-white flex items-center justify-center" style={{ background: cp }}>Ver</div>
                      </div>
                    </div>
                  );
                  return (
                    <div key={v.id} className="relative rounded-xl overflow-hidden shadow-sm h-20">
                      <img src={img} alt={v.nombre} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-1.5 left-2 right-2">
                        <p className="text-white text-[10px] font-bold truncate">{v.nombre}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={v.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div className="h-20 overflow-hidden">
                      <img src={img} alt={v.nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-700 truncate mb-1">{v.nombre}</p>
                      {precio && <p className="text-[10px] text-gray-400 mb-1">{precio}</p>}
                      <div className="w-full h-5 text-[10px] font-bold rounded-lg text-white flex items-center justify-center" style={{ background: cp }}>Ver</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contacto preview */}
          <div className="p-6 bg-white">
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: cp }}>Contacto</p>
            <div className="flex gap-3 flex-wrap">
              {config.redes_sociales.whatsapp && (
                <div className="px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-full">WhatsApp</div>
              )}
              {config.redes_sociales.instagram && (
                <div className="px-3 py-1.5 bg-pink-50 text-pink-700 text-xs rounded-full">@{config.redes_sociales.instagram}</div>
              )}
              {config.telefono && (
                <div className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-full">{config.telefono}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
