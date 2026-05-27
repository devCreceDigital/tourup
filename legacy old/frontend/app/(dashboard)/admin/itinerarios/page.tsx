"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Edit, Trash2, Copy, MapPin, Clock,
  Calendar, ChevronLeft, ChevronRight, Loader2, X, FileText
} from "lucide-react";
import { fetchDjango } from "@/lib/api";
import type { Itinerario } from "@/types";

const ESTADO_CFG: Record<string, { bg: string; text: string; label: string }> = {
  activo:    { bg: "bg-[#e1f5ee]", text: "text-[#0f6e56]", label: "Activo"    },
  inactivo:  { bg: "bg-[#f5f3fb]", text: "text-[#666]",    label: "Inactivo"  },
  archivado: { bg: "bg-[#faeeda]", text: "text-[#854f0b]", label: "Archivado" },
};

export default function ItinerariosAdminPage() {
  const router = useRouter();
  const [itinerarios, setItinerarios] = useState<Itinerario[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoDesc, setNuevoDesc] = useState("");
  const [creando, setCreando] = useState(false);
  const itemsPerPage = 20;

  const loadItinerarios = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      qs.set("page", String(currentPage));
      if (searchTerm.trim()) qs.set("search", searchTerm.trim());
      if (estadoFilter !== "all") qs.set("estado", estadoFilter);
      const res = await fetchDjango(`/itinerarios/?${qs.toString()}`);
      const data = await res.json();
      const results: Itinerario[] = Array.isArray(data) ? data : (data?.results ?? []);
      setItinerarios(results);
      setTotalCount(typeof data?.count === "number" ? data.count : results.length);
    } catch (err) {
      console.error("Error cargando itinerarios:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, estadoFilter]);

  useEffect(() => {
    const t = setTimeout(() => void loadItinerarios(), 0);
    return () => clearTimeout(t);
  }, [loadItinerarios]);

  const handleClonar = async (it: Itinerario) => {
    if (cloningId) return;
    setCloningId(it.id);
    try {
      const res = await fetchDjango(`/itinerarios/${it.id}/clonar/`, { method: "POST", headers: { "Content-Type": "application/json" } });
      if (res.ok) await loadItinerarios();
      else alert("No se pudo clonar el itinerario.");
    } catch { alert("Error al clonar."); }
    finally { setCloningId(null); }
  };

  const handleEliminar = async (it: Itinerario) => {
    if (!window.confirm(`¿Eliminar "${it.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetchDjango(`/itinerarios/${it.id}/`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setItinerarios(prev => prev.filter(i => i.id !== it.id));
        setTotalCount(prev => Math.max(0, prev - 1));
      } else alert("No se pudo eliminar el itinerario.");
    } catch { alert("Error al eliminar."); }
  };

  const handleCrear = async () => {
    if (!nuevoNombre.trim()) return;
    setCreando(true);
    try {
      const res = await fetchDjango("/itinerarios/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre.trim(), descripcion: nuevoDesc.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowModal(false);
        setNuevoNombre("");
        setNuevoDesc("");
        router.push(`/admin/itinerarios/${data.id}/editar`);
      } else alert("No se pudo crear el itinerario.");
    } catch { alert("Error al crear."); }
    finally { setCreando(false); }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="bg-white rounded-xl border border-[#E0E4EF] px-6 py-4 flex items-center justify-between shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-[#5B4FE8]" />
          <div>
            <span className="text-[16px] font-extrabold text-[#1a1a2e]">Itinerarios</span>
            <p className="text-[11px] text-[#aaa]">Construye y gestiona itinerarios día a día para tus viajes</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[12px] font-bold hover:bg-[#4a3fd0] transition"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo Itinerario
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl border border-[#E0E4EF] px-4 py-3 flex items-center gap-3 shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        <Search className="h-4 w-4 text-[#aaa] flex-shrink-0" />
        <input
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar por nombre o descripción..."
          className="flex-1 text-[12px] outline-none text-[#1a1a2e] placeholder:text-[#ccc]"
        />
        <select
          value={estadoFilter}
          onChange={e => { setEstadoFilter(e.target.value); setCurrentPage(1); }}
          className="text-[12px] border border-[#ede9f8] rounded-lg px-3 py-1.5 outline-none focus:border-[#5B4FE8] bg-white text-[#666]"
        >
          <option value="all">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="archivado">Archivado</option>
        </select>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-[#f5f3fb] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : itinerarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E4EF] py-16 flex flex-col items-center gap-3 shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
          <MapPin className="h-10 w-10 text-[#ddd]" />
          <p className="text-[13px] font-semibold text-[#aaa]">No hay itinerarios aún</p>
          <p className="text-[11px] text-[#ccc]">Crea tu primer itinerario para empezar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itinerarios.map(it => {
            const cfg = ESTADO_CFG[it.estado] ?? { bg: "bg-[#f5f3fb]", text: "text-[#666]", label: it.estado };
            return (
              <div key={it.id} className="bg-white rounded-xl border border-[#E0E4EF] p-5 flex flex-col gap-3 hover:shadow-[0_4px_20px_rgba(91,79,232,0.12)] hover:border-[#c5bff5] transition shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-extrabold text-[#1a1a2e] truncate">{it.nombre}</h3>
                    {it.descripcion && <p className="text-[11px] text-[#aaa] mt-0.5 line-clamp-2">{it.descripcion}</p>}
                  </div>
                  <span className={"inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold " + cfg.bg + " " + cfg.text}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#aaa]">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{it.total_dias ?? it.dias?.length ?? 0} días</span>
                  <span className="flex items-center gap-1 bg-[#eeedfe] text-[#5B4FE8] px-2 py-0.5 rounded-full font-bold">v{it.version}</span>
                  {it.created_at && (
                    <span className="flex items-center gap-1 ml-auto">
                      <Calendar className="h-3 w-3" />
                      {new Date(it.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t border-[#f5f3fb]">
                  <Link href={`/admin/itinerarios/${it.id}/editar`} className="flex-1">
                    <button className="w-full inline-flex items-center justify-center gap-1.5 border border-[#ede9f8] rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#5B4FE8] hover:bg-[#f0edf8] transition">
                      <Edit className="h-3.5 w-3.5" /> Editar
                    </button>
                  </Link>
                  <button
                    onClick={() => void handleClonar(it)}
                    disabled={cloningId === it.id}
                    className="inline-flex items-center gap-1.5 border border-[#ede9f8] rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#666] hover:bg-[#f5f3fb] transition disabled:opacity-60"
                  >
                    {cloningId === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                    Clonar
                  </button>
                  <button
                    onClick={() => void handleEliminar(it)}
                    className="p-1.5 text-[#aaa] hover:text-[#a32d2d] hover:bg-[#fcebeb] rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINACION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-[#E0E4EF] px-5 py-3 shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
          <p className="text-[11px] text-[#aaa]">Mostrando {itinerarios.length} de {totalCount} itinerarios</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#ede9f8] text-[#aaa] hover:bg-[#f0edf8] disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12px] font-semibold text-[#1a1a2e]">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#ede9f8] text-[#aaa] hover:bg-[#f0edf8] disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL NUEVO ITINERARIO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#5B4FE8]" />
                <h3 className="text-[14px] font-extrabold text-[#1a1a2e]">Nuevo Itinerario</h3>
              </div>
              <button onClick={() => { setShowModal(false); setNuevoNombre(""); setNuevoDesc(""); }} className="p-1.5 text-[#aaa] hover:text-[#555] rounded-lg transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Nombre del itinerario *</label>
                <input
                  autoFocus
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && void handleCrear()}
                  placeholder="Ej: Cusco 5 días - Valle Sagrado"
                  className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Descripción (opcional)</label>
                <textarea
                  value={nuevoDesc}
                  onChange={e => setNuevoDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe brevemente este itinerario..."
                  className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] resize-none transition"
                />
              </div>
              <p className="text-[10px] text-[#aaa]">Al crear se abrirá el editor para agregar los días y actividades.</p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => { setShowModal(false); setNuevoNombre(""); setNuevoDesc(""); }} className="rounded-lg border border-[#ede9f8] px-4 py-2 text-[11px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">Cancelar</button>
              <button onClick={handleCrear} disabled={creando || !nuevoNombre.trim()} className="rounded-lg bg-[#5B4FE8] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#4a3fd0] transition disabled:opacity-60 flex items-center gap-1.5">
                {creando && <Loader2 className="h-3 w-3 animate-spin" />}
                {creando ? "Creando..." : "Crear y Editar →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
