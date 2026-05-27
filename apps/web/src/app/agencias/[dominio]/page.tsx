"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Phone, Globe, Link2, Share2, Clock, Users, ArrowRight, MessageCircle } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

interface Agencia {
  id: string; nombre: string; dominio: string;
  logo_url?: string; banner_url?: string; slogan?: string;
  descripcion?: string; color_primario: string; color_secundario: string;
  website?: string; telefono?: string;
  redes_sociales?: { instagram?: string; facebook?: string; whatsapp?: string; tiktok?: string };
  preferencias?: { card_style?: string };
}
interface Viaje {
  id: string; nombre: string; slug: string; estado: string; cupos: number; moneda: string;
  configuracion?: { imagen_url?: string; tipo_viaje?: string; descripciones_basicas?: { subtitulo?: string; duracion?: string; precio?: string }; precios_detalle?: Array<{ monto: number; destacado?: boolean }> };
}

export default function PaginaAgenciaPage() {
  const { dominio } = useParams<{ dominio: string }>();
  const [agencia, setAgencia] = useState<Agencia | null>(null);
  const [viajes, setViajes]   = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    requestTotemApi(`/tenancy/public/${encodeURIComponent(dominio)}`)
      .then(r => r.json())
      .then(async d => {
        const agency = d.agencia ?? d;
        setAgencia({
          id: agency.id ?? agency.tenantId,
          nombre: agency.nombre ?? agency.name ?? "",
          dominio: agency.dominio ?? agency.domain ?? dominio,
          logo_url: agency.logo_url ?? agency.logoUrl ?? undefined,
          banner_url: agency.banner_url ?? agency.bannerUrl ?? undefined,
          slogan: agency.slogan ?? "",
          descripcion: agency.descripcion ?? agency.description ?? "",
          color_primario: agency.color_primario ?? agency.primaryColor ?? "#5B4FE8",
          color_secundario: agency.color_secundario ?? agency.secondaryColor ?? "#1a1a2e",
          website: agency.website ?? "",
          telefono: agency.telefono ?? agency.phone ?? "",
          redes_sociales: agency.redes_sociales ?? agency.socialLinks ?? {},
          preferencias: agency.preferencias ?? agency.preferences?.preferences ?? {},
        });
        const tenantId = agency.id ?? agency.tenantId;
        if (typeof tenantId === "string" && tenantId.length > 0) {
          const tripsResponse = await requestTotemApi(`/trips?tenantId=${encodeURIComponent(tenantId)}&pageSize=100`);
          const tripsPayload = tripsResponse.ok ? await tripsResponse.json() : [];
          setViajes(Array.isArray(tripsPayload) ? tripsPayload : tripsPayload.results ?? []);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [dominio]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0edf8]">
      <div className="w-10 h-10 border-2 border-[#5B4FE8] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error || !agencia) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0edf8]">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">Agencia no encontrada</p>
        <Link href="/" className="text-[#5B4FE8] hover:underline">Volver al inicio</Link>
      </div>
    </div>
  );

  const cp = agencia.color_primario || "#5B4FE8";
  const cs = agencia.color_secundario || "#1a1a2e";
  const getPrecio = (v: Viaje) => {
    const pd = v.configuracion?.precios_detalle;
    if (pd?.length) {
      const d = pd.find(p => p.destacado) ?? pd[0];
      if (d === undefined) return "—";
      return `${v.moneda === "PEN" ? "S/." : "$"} ${d.monto.toLocaleString()}`;
    }
    return v.configuracion?.descripciones_basicas?.precio ?? "—";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar mínimo */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {agencia.logo_url ? (
              <img src={agencia.logo_url} alt={agencia.nombre} className="h-9 w-auto object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: cp }}>
                {agencia.nombre[0]}
              </div>
            )}
            <span className="font-bold text-gray-900 text-lg">{agencia.nombre}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#viajes" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Viajes</a>
            <a href="#contacto" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Contacto</a>
            {agencia.redes_sociales?.whatsapp && (
              <a href={`https://wa.me/${agencia.redes_sociales.whatsapp}`} target="_blank"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all"
                style={{ background: cp }}>
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center" style={{ background: cs }}>
        {agencia.banner_url && (
          <div className="absolute inset-0">
            <img src={agencia.banner_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${cs}ee, ${cs}88)` }} />
          </div>
        )}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 text-white">
          <div className="max-w-2xl">
            {agencia.logo_url && (
              <img src={agencia.logo_url} alt={agencia.nombre} className="h-16 w-auto object-contain mb-8" />
            )}
            <h1 className="text-5xl font-black leading-tight mb-4">{agencia.nombre}</h1>
            {agencia.slogan && (
              <p className="text-xl text-white/80 mb-8 leading-relaxed">{agencia.slogan}</p>
            )}
            <div className="flex flex-wrap gap-4">
              <a href="#viajes"
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all hover:opacity-90"
                style={{ background: cp }}>
                Ver viajes <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#contacto"
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl border-2 border-white/30 hover:bg-white/10 transition-all">
                Contactarnos
              </a>
            </div>
          </div>
        </div>
        {/* Stats flotantes */}
        {viajes.length > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6">
            {[
              { label: "Viajes disponibles", value: viajes.length },
              { label: "Cupos totales", value: viajes.reduce((a, v) => a + v.cupos, 0) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center text-white bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20">
                <p className="text-2xl font-black">{value}</p>
                <p className="text-xs text-white/70">{label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sobre nosotros */}
      {agencia.descripcion && (
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: cp }}>Sobre nosotros</p>
              <h2 className="text-3xl font-black text-gray-900 mb-6 leading-tight">¿Quiénes somos?</h2>
              <p className="text-gray-600 leading-relaxed text-lg">{agencia.descripcion}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Viajes activos", value: viajes.length, icon: "✈️" },
                { label: "Años de experiencia", value: "5+", icon: "⭐" },
                { label: "Viajeros felices", value: "1,200+", icon: "😊" },
                { label: "Destinos", value: "20+", icon: "🗺️" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-2xl font-black text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Viajes */}
      <section id="viajes" className="py-20" style={{ background: "#f8f7ff" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: cp }}>Nuestros viajes</p>
            <h2 className="text-3xl font-black text-gray-900">Destinos disponibles</h2>
          </div>
          {viajes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Próximamente nuevos viajes</p>
            </div>
          ) : (
            <div className={agencia.preferencias?.card_style === "spotlight" ? "grid grid-cols-3 grid-rows-2 gap-4 auto-rows-[150px]" : "grid grid-cols-3 gap-6"}>
              {viajes.map((v, idx) => {
                const img = v.configuracion?.imagen_url || "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800";
                const style = agencia.preferencias?.card_style ?? "clasica";

                if (style === "grande") return (
                  <div key={v.id} className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group h-64">
                    <img src={img} alt={v.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-bold text-white text-lg mb-1">{v.nombre}</h3>
                      <p className="text-white/70 text-sm mb-3">{v.configuracion?.descripciones_basicas?.subtitulo ?? ""}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold">{getPrecio(v)}</span>
                        <Link href={`/viajes/${v.slug}`}
                          className="px-4 py-2 text-sm font-bold text-white rounded-xl hover:opacity-90"
                          style={{ background: cp }}>
                          Ver <ArrowRight className="w-3.5 h-3.5 inline" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );

                if (style === "spotlight") {
                  if (idx === 0) return (
                    <div key={v.id} className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group cursor-pointer" style={{minHeight: '320px'}}>
                      <img src={img} alt={v.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 text-xs font-bold text-white rounded-full" style={{ background: cp }}>✨ Destacado</span>
                      </div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="font-black text-white text-2xl mb-2 leading-tight">{v.nombre}</h3>
                        <p className="text-white/70 text-sm mb-4 line-clamp-2">{v.configuracion?.descripciones_basicas?.subtitulo ?? ""}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white/60 text-xs">Desde</p>
                            <p className="text-white font-black text-xl">{getPrecio(v)}</p>
                          </div>
                          <Link href={`/viajes/${v.slug}`}
                            className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-all"
                            style={{ background: cp }}>
                            Ver viaje <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <div key={v.id} className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                      <img src={img} alt={v.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0" style={{minHeight:'150px'}} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-bold text-white text-sm truncate">{v.nombre}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-white/80 text-xs">{getPrecio(v)}</span>
                          <Link href={`/viajes/${v.slug}`}
                            className="text-xs font-bold text-white px-2 py-1 rounded-lg hover:opacity-90"
                            style={{ background: cp }}>
                            Ver
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={v.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                    <div className="relative h-48 overflow-hidden">
                      <img src={img} alt={v.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-3 right-3">
                        <span className="text-white font-bold text-sm bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">{getPrecio(v)}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-1">{v.nombre}</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{v.configuracion?.descripciones_basicas?.subtitulo ?? ""}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                        {v.configuracion?.descripciones_basicas?.duracion && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{v.configuracion.descripciones_basicas.duracion}</span>
                        )}
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{v.cupos} cupos</span>
                      </div>
                      <Link href={`/viajes/${v.slug}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90"
                        style={{ background: cp }}>
                        Ver detalles <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: cp }}>Contacto</p>
            <h2 className="text-3xl font-black text-gray-900">¿Listo para viajar?</h2>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            {agencia.telefono && (
              <a href={`tel:${agencia.telefono}`}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${cp}15` }}>
                  <Phone className="w-5 h-5" style={{ color: cp }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Teléfono</p>
                  <p className="text-gray-500 text-xs">{agencia.telefono}</p>
                </div>
              </a>
            )}
            {agencia.redes_sociales?.whatsapp && (
              <a href={`https://wa.me/${agencia.redes_sociales.whatsapp}`} target="_blank"
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-50">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">WhatsApp</p>
                  <p className="text-gray-500 text-xs">Escríbenos</p>
                </div>
              </a>
            )}
            {agencia.redes_sociales?.instagram && (
              <a href={`https://instagram.com/${agencia.redes_sociales.instagram}`} target="_blank"
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-pink-50">
                  <Link2 className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Link2</p>
                  <p className="text-gray-500 text-xs">@{agencia.redes_sociales.instagram}</p>
                </div>
              </a>
            )}
            {agencia.website && (
              <a href={agencia.website} target="_blank"
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${cp}15` }}>
                  <Globe className="w-5 h-5" style={{ color: cp }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Website</p>
                  <p className="text-gray-500 text-xs truncate max-w-[120px]">{agencia.website}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">© 2026 {agencia.nombre}. Powered by <span className="font-semibold" style={{ color: cp }}>Traventia</span></p>
          <div className="flex items-center gap-4">
            {agencia.redes_sociales?.instagram && (
              <a href={`https://instagram.com/${agencia.redes_sociales.instagram}`} target="_blank" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Link2 className="w-4 h-4" />
              </a>
            )}
            {agencia.redes_sociales?.facebook && (
              <a href={`https://facebook.com/${agencia.redes_sociales.facebook}`} target="_blank" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Share2 className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
