"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, Clock, MapPin, DollarSign, Check, MessageCircle, Phone, Globe, ChevronRight } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

interface Viaje {
  id: string; nombre: string; slug: string; estado?: string; status?: string; tenantId?: string | null;
  cupos: number; moneda: string; fecha_inicio?: string; fecha_fin?: string;
  configuracion?: {
    imagen_url?: string; tipo_viaje?: string; descripcion?: string;
    descripciones_basicas?: { titulo?: string; subtitulo?: string; duracion?: string; precio?: string };
    precios_detalle?: Array<{ id: string; nombre: string; monto: number; moneda?: string; destacado?: boolean }>;
    precio_base?: number;
    incluye?: string[];
    no_incluye?: string[];
  };
}

interface Agencia {
  nombre: string; dominio: string; logo_url?: string;
  color_primario: string; color_secundario: string;
  telefono?: string; website?: string;
  redes_sociales?: { whatsapp?: string; instagram?: string };
}

export default function ViajePublicoPage() {
  const { slug } = useParams<{ slug: string }>();
  const [viaje, setViaje]     = useState<Viaje | null>(null);
  const [agencia, setAgencia] = useState<Agencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    requestTotemApi(`/trips/public/${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => {
        const v = Array.isArray(d) ? d[0] : d.results?.[0] ?? d;
        if (!v?.id) { setError(true); return; }
        setViaje(v);
        const agencyLookup = typeof v.tenantDomain === "string" && v.tenantDomain.length > 0
          ? `/tenancy/public/${encodeURIComponent(v.tenantDomain)}`
          : typeof v.domain === "string" && v.domain.length > 0
            ? `/tenancy/public/${encodeURIComponent(v.domain)}`
            : typeof v.tenantId === "string" && v.tenantId.length > 0
              ? `/tenancy/public/tenant/${encodeURIComponent(v.tenantId)}`
              : null;
        if (agencyLookup !== null) {
          requestTotemApi(agencyLookup)
            .then(r => r.json())
            .then(a => {
              const agency = a.agencia ?? a;
              setAgencia({
                nombre: agency.nombre ?? agency.name ?? "",
                dominio: agency.dominio ?? agency.domain ?? "",
                logo_url: agency.logo_url ?? agency.logoUrl ?? undefined,
                color_primario: agency.color_primario ?? agency.primaryColor ?? "#5B4FE8",
                color_secundario: agency.color_secundario ?? agency.secondaryColor ?? "#1a1a2e",
                telefono: agency.telefono ?? agency.phone ?? undefined,
                website: agency.website ?? undefined,
                redes_sociales: agency.redes_sociales ?? agency.socialLinks ?? {},
              });
            })
            .catch(() => {});
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0edf8]">
      <div className="w-10 h-10 border-2 border-[#5B4FE8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !viaje) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0edf8]">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">Viaje no encontrado</p>
        <Link href="/" className="text-[#5B4FE8] hover:underline">Volver al inicio</Link>
      </div>
    </div>
  );

  const cp = agencia?.color_primario || "#5B4FE8";
  const cs = agencia?.color_secundario || "#1a1a2e";
  const cfg = viaje.configuracion ?? {};
  const db = cfg.descripciones_basicas ?? {};
  const img = cfg.imagen_url || "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1600";
  const precio_base = cfg.precio_base ?? cfg.precios_detalle?.[0]?.monto ?? 0;
  const moneda = viaje.moneda === "PEN" ? "S/." : viaje.moneda === "EUR" ? "€" : "$";

  const INCLUYE_DEFAULT = ["Transporte ida y vuelta", "Alojamiento", "Alimentación incluida", "Guía especializado", "Seguro de viaje"];
  const NO_INCLUYE_DEFAULT = ["Gastos personales", "Propinas", "Actividades opcionales"];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {agencia && (
              <Link href={`/agencias/${agencia.dominio}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <ArrowLeft className="w-4 h-4 text-gray-500" />
                {agencia.logo_url ? (
                  <img src={agencia.logo_url} alt={agencia.nombre} className="h-8 w-auto object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: cp }}>
                    {agencia.nombre[0]}
                  </div>
                )}
                <span className="font-bold text-gray-900">{agencia.nombre}</span>
              </Link>
            )}
          </div>
          {agencia?.redes_sociales?.whatsapp && (
            <a href={`https://wa.me/${agencia.redes_sociales.whatsapp}?text=Hola, me interesa el viaje: ${viaje.nombre}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl"
              style={{ background: cp }}>
              <MessageCircle className="w-4 h-4" /> Consultar
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative h-[60vh] overflow-hidden">
        <img src={img} alt={viaje.nombre} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${cs}ee 0%, ${cs}44 50%, transparent 100%)` }} />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-6xl mx-auto">
          <div className="flex items-end justify-between">
            <div className="text-white">
              {cfg.tipo_viaje && (
                <span className="inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 text-white" style={{ background: cp }}>
                  {cfg.tipo_viaje.toUpperCase()}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight">{viaje.nombre}</h1>
              {db.subtitulo && <p className="text-xl text-white/80">{db.subtitulo}</p>}
            </div>
            <div className="hidden md:block bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-white text-right">
              <p className="text-white/60 text-sm mb-1">Precio desde</p>
              <p className="text-3xl font-black">{moneda} {precio_base.toLocaleString()}</p>
              {db.duracion && <p className="text-white/60 text-sm mt-1">{db.duracion}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="col-span-2 space-y-8">
            {/* Info rápida */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: "Inicio", value: viaje.fecha_inicio || "Por confirmar" },
                { icon: Calendar, label: "Fin", value: viaje.fecha_fin || "Por confirmar" },
                { icon: Clock,    label: "Duración", value: db.duracion || "—" },
                { icon: Users,    label: "Cupos", value: `${viaje.cupos} personas` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-[#f8f7ff] rounded-2xl p-4 text-center">
                  <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `${cp}20` }}>
                    <Icon className="w-4 h-4" style={{ color: cp }} />
                  </div>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            {/* Descripción */}
            {cfg.descripcion && (
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-4">Sobre este viaje</h2>
                <p className="text-gray-600 leading-relaxed text-base">{cfg.descripcion}</p>
              </div>
            )}

            {/* Incluye / No incluye */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-emerald-50 rounded-2xl p-5">
                <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" /> Incluye
                </h3>
                <ul className="space-y-2">
                  {(cfg.incluye ?? INCLUYE_DEFAULT).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 rounded-2xl p-5">
                <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center font-black">✕</span> No incluye
                </h3>
                <ul className="space-y-2">
                  {(cfg.no_incluye ?? NO_INCLUYE_DEFAULT).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="flex-shrink-0 mt-0.5 font-bold">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar — precio y CTA */}
          <div className="space-y-4">
            {/* Card de precio */}
            <div className="bg-white rounded-2xl border-2 border-[#ede9f8] p-6 sticky top-20 shadow-lg">
              <p className="text-gray-500 text-sm mb-1">Precio por persona</p>
              <p className="text-3xl font-black text-gray-900 mb-1">{moneda} {precio_base.toLocaleString()}</p>
              {db.duracion && <p className="text-gray-400 text-sm mb-5">{db.duracion}</p>}

              {/* Opciones de precio */}
              {cfg.precios_detalle && cfg.precios_detalle.length > 0 && (
                <div className="space-y-2 mb-5">
                  {cfg.precios_detalle.map(p => (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${p.destacado ? "border-[#5B4FE8] bg-[#5B4FE8]/5" : "border-[#ede9f8] hover:border-gray-300"}`}>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                        {p.destacado && <p className="text-xs text-[#5B4FE8]">Más popular</p>}
                      </div>
                      <p className="font-bold text-gray-900">{moneda} {p.monto.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {agencia?.redes_sociales?.whatsapp ? (
                <a href={`https://wa.me/${agencia.redes_sociales.whatsapp}?text=Hola! Me interesa inscribirme en: ${viaje.nombre}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-all mb-3"
                  style={{ background: cp }}>
                  <MessageCircle className="w-4 h-4" /> Reservar ahora
                </a>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-all mb-3"
                  style={{ background: cp }}>
                  Reservar ahora
                </button>
              )}

              <p className="text-xs text-gray-400 text-center">Sin compromiso — te contactamos en 24h</p>

              {/* Contacto agencia */}
              {agencia && (
                <div className="mt-5 pt-5 border-t border-[#ede9f8] space-y-2">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Contacto directo</p>
                  {agencia.telefono && (
                    <a href={`tel:${agencia.telefono}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                      <Phone className="w-4 h-4" style={{ color: cp }} />
                      {agencia.telefono}
                    </a>
                  )}
                  {agencia.website && (
                    <a href={agencia.website} target="_blank" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                      <Globe className="w-4 h-4" style={{ color: cp }} />
                      {agencia.website}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {agencia ? `© 2026 ${agencia.nombre}. Powered by ` : "Powered by "}
            <span className="font-semibold" style={{ color: cp }}>Traventia</span>
          </p>
          {agencia && (
            <Link href={`/agencias/${agencia.dominio}`} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              Ver todos los viajes <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
