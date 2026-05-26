"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Filter, MapPin, Clock, Users,
  MoreHorizontal, Star, TrendingUp, Eye, Edit
} from "lucide-react";
import { fetchDjango } from "@/lib/api";

interface Viaje {
  id: string;
  nombre: string;
  codigo: string;
  slug: string;
  estado: string;
  cupos: number;
  moneda: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  configuracion?: {
    imagen_url?: string;
    tipo_viaje?: string;
    descripciones_basicas?: { titulo?: string; subtitulo?: string; duracion?: string; precio?: string };
    precios_detalle?: Array<{ monto: number; moneda: string; destacado?: boolean }>;
  };
}

const ESTADO_STYLE: Record<string, string> = {
  publicado:  "bg-emerald-100 text-emerald-700",
  borrador:   "bg-gray-100 text-gray-500",
  archivado:  "bg-orange-100 text-orange-600",
  cancelado:  "bg-red-100 text-red-600",
};

const TIPO_COLORS: Record<string, string> = {
  grupal:     "bg-[#5B4FE8]/10 text-[#5B4FE8]",
  escolar:    "bg-blue-100 text-blue-700",
  individual: "bg-teal-100 text-teal-700",
  familiar:   "bg-pink-100 text-pink-600",
};

export default function ViajesPage() {
  const [viajes, setViajes]       = useState<Viaje[]>([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState("");
  const [filtroEstado, setFiltro] = useState("todos");
  const [openMenu, setOpenMenu]   = useState<string | null>(null);

  useEffect(() => {
    fetchDjango("/viajes/")
      .then(r => r.json())
      .then(d => setViajes(Array.isArray(d) ? d : Array.isArray(d.results) ? d.results : []))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = viajes.filter(v => {
    const matchQ = v.nombre?.toLowerCase().includes(q.toLowerCase());
    const matchE = filtroEstado === "todos" || v.estado === filtroEstado;
    return matchQ && matchE;
  });

  const getPrecio = (v: Viaje) => {
    const pd = v.configuracion?.precios_detalle;
    if (pd?.length) {
      const dest = pd.find(p => p.destacado) ?? pd[0];
      return `${v.moneda === "PEN" ? "S/." : "$"} ${dest.monto.toLocaleString()}`;
    }
    return v.configuracion?.descripciones_basicas?.precio ?? "—";
  };

  const getImagen = (v: Viaje) =>
    v.configuracion?.imagen_url ||
    "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800";

  const stats = {
    activos:    viajes.filter(v => v.estado === "publicado").length,
    inscritos:  0,
    pendientes: 0,
    docs:       0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Viajes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Administra todos los viajes de tu empresa</p>
        </div>
        <Link
          href="/admin/viajes/crear"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#5B4FE8] text-white text-sm font-semibold rounded-xl hover:bg-[#4a3fd4] transition-colors shadow-lg shadow-[#5B4FE8]/25"
        >
          <Plus className="w-4 h-4" />
          Nuevo Viaje
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "VIAJES ACTIVOS",    value: stats.activos,    sub: `${viajes.length} total`,       color: "text-[#5B4FE8]", bg: "bg-[#5B4FE8]/10" },
          { label: "INSCRITOS",         value: stats.inscritos,  sub: "Total registrados",            color: "text-[#1D9E75]", bg: "bg-[#1D9E75]/10" },
          { label: "PAGOS VENCIDOS",    value: stats.pendientes, sub: "Al día",                       color: "text-red-500",   bg: "bg-red-50" },
          { label: "DOCS POR REVISAR",  value: stats.docs,       sub: "Pendientes",                   color: "text-orange-500",bg: "bg-orange-50" },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#ede9f8] p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
              <TrendingUp className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 tracking-wide">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#ede9f8] p-4 flex items-center gap-3">
        <select
          className="text-sm border border-[#ede9f8] rounded-lg px-3 py-2 focus:outline-none focus:border-[#5B4FE8] bg-white"
          value={filtroEstado}
          onChange={e => setFiltro(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="publicado">Publicado</option>
          <option value="borrador">Borrador</option>
          <option value="archivado">Archivado</option>
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#ede9f8] rounded-lg focus:outline-none focus:border-[#5B4FE8]"
            placeholder="Buscar viajes..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de viajes */}
      {loading ? (
        <div className="grid grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#ede9f8] overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filtrados.map(v => (
            <div
              key={v.id}
              className="bg-white rounded-2xl border border-[#ede9f8] overflow-hidden hover:border-[#5B4FE8]/40 hover:shadow-[0_8px_32px_rgba(91,79,232,0.12)] transition-all group"
            >
              {/* Imagen */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={getImagen(v)}
                  alt={v.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {/* Badges sobre imagen */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${ESTADO_STYLE[v.estado] ?? "bg-gray-100 text-gray-500"}`}>
                    {v.estado.toUpperCase()}
                  </span>
                  {v.configuracion?.tipo_viaje && (
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${TIPO_COLORS[v.configuracion.tipo_viaje] ?? "bg-gray-100 text-gray-500"}`}>
                      {v.configuracion.tipo_viaje.toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Menu */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setOpenMenu(openMenu === v.id ? null : v.id)}
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-white" />
                  </button>
                  {openMenu === v.id && (
                    <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-[#ede9f8] py-1.5 w-40 z-10">
                      <Link href={`/admin/viajes/${v.id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#f0edf8]">
                        <Eye className="w-3.5 h-3.5" /> Ver detalle
                      </Link>
                      <Link href={`/admin/viajes/${v.id}/editar/basico`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#f0edf8]">
                        <Edit className="w-3.5 h-3.5" /> Editar
                      </Link>
                    </div>
                  )}
                </div>
                {/* Precio en imagen */}
                <div className="absolute bottom-3 right-3">
                  <span className="text-white font-bold text-sm bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                    {getPrecio(v)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{v.nombre}</h3>
                <p className="text-xs text-gray-400 mb-3 truncate">
                  {v.configuracion?.descripciones_basicas?.subtitulo ?? v.codigo}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  {v.configuracion?.descripciones_basicas?.duracion && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {v.configuracion.descripciones_basicas.duracion}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {v.cupos} cupos
                  </span>
                </div>
                {/* Barra progreso ficticia */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Ocupación</span>
                    <span>0%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#5B4FE8] to-[#00D4C8] rounded-full" style={{ width: "0%" }} />
                  </div>
                </div>
                <Link
                  href={`/admin/viajes/${v.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#5B4FE8] border border-[#5B4FE8]/30 rounded-xl hover:bg-[#5B4FE8] hover:text-white transition-all"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver itinerario
                </Link>
              </div>
            </div>
          ))}

          {/* Card agregar */}
          <Link
            href="/admin/viajes/crear"
            className="bg-white rounded-2xl border-2 border-dashed border-[#ede9f8] hover:border-[#5B4FE8]/40 hover:bg-[#f0edf8]/50 transition-all flex flex-col items-center justify-center gap-3 min-h-[320px] group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#5B4FE8]/10 flex items-center justify-center group-hover:bg-[#5B4FE8]/20 transition-colors">
              <Plus className="w-7 h-7 text-[#5B4FE8]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 group-hover:text-[#5B4FE8] transition-colors">Agregar Nuevo Viaje</p>
              <p className="text-xs text-gray-400 mt-1">Crea un nuevo viaje para tu agencia</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
