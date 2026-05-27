"use client";
import Link from "next/link";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Plus, Edit, Trash2, MoreVertical, MapPin, CheckCircle2,
  AlertCircle, Save, Bus, Hotel, Star, Coffee, Loader2
} from "lucide-react";
import { fetchDjango } from "@/lib/api";

type EstadoActividad = "confirmado" | "pendiente" | "cancelado";
type Actividad = {
  id: string; hora: string; horaLabel?: string; titulo: string;
  descripcion: string; estado: EstadoActividad; tipo: string;
  lugar?: string; asignados?: string[];
};
type Dia = {
  id: string; numero: number; fecha: string;
  titulo: string; subtitulo?: string; actividades: Actividad[];
};

const ESTADO: Record<EstadoActividad, { bg: string; text: string; label: string }> = {
  confirmado: { bg: "bg-[#e1f5ee]", text: "text-[#0f6e56]", label: "Confirmado" },
  pendiente:  { bg: "bg-[#faeeda]", text: "text-[#854f0b]", label: "Pendiente"  },
  cancelado:  { bg: "bg-[#fcebeb]", text: "text-[#a32d2d]", label: "Cancelado"  },
};
const TIPO: Record<string, { icon: typeof Bus; color: string; bg: string; barColor: string }> = {
  traslado:  { icon: Bus,    color: "text-[#5B4FE8]", bg: "bg-[#eeedfe]", barColor: "#5B4FE8" },
  hotel:     { icon: Hotel,  color: "text-[#BA7517]", bg: "bg-[#faeeda]", barColor: "#BA7517" },
  evento:    { icon: Star,   color: "text-[#1D9E75]", bg: "bg-[#e1f5ee]", barColor: "#1D9E75" },
  actividad: { icon: Coffee, color: "text-[#185FA5]", bg: "bg-[#e6f1fb]", barColor: "#185FA5" },
};

// Genera array de dias entre dos fechas ISO
function generarDias(fechaInicio: string, fechaFin: string): Dia[] {
  const dias: Dia[] = [];
  const start = new Date(fechaInicio + "T00:00:00");
  const end   = new Date(fechaFin   + "T00:00:00");
  let current = new Date(start);
  let num = 1;
  while (current <= end) {
    dias.push({
      id: `d${num}`,
      numero: num,
      fecha: current.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
      titulo: "",
      actividades: [],
    });
    current.setDate(current.getDate() + 1);
    num++;
    if (num > 60) break; // safety
  }
  return dias;
}

export default function ViajeItinerarioPage() {
  const params = useParams<{ id: string }>();
  const viajeId = params?.id ?? "";

  const [dias, setDias] = useState<Dia[]>([]);
  const [diaActivo, setDiaActivo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editando, setEditando] = useState<Actividad | null>(null);

  // Carga viaje y construye dias desde configuracion o fechas
  const loadItinerario = useCallback(async () => {
    if (!viajeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDjango(`/viajes/${viajeId}/`);
      if (!res.ok) { setError("No se pudo cargar el viaje."); return; }
      const viaje = await res.json();

      const cfg = viaje.configuracion ?? {};
      let diasCargados: Dia[] = [];

      // 1. Si ya hay itinerario guardado en configuracion, usarlo
      if (Array.isArray(cfg.itinerario) && cfg.itinerario.length > 0) {
        diasCargados = cfg.itinerario;
      }
      // 2. Si no, generar desde fechas del viaje
      else if (viaje.fecha_inicio && viaje.fecha_fin) {
        diasCargados = generarDias(viaje.fecha_inicio, viaje.fecha_fin);
      }
      // 3. Fallback: 3 dias vacios
      else {
        diasCargados = [
          { id: "d1", numero: 1, fecha: "Dia 1", titulo: "", actividades: [] },
          { id: "d2", numero: 2, fecha: "Dia 2", titulo: "", actividades: [] },
          { id: "d3", numero: 3, fecha: "Dia 3", titulo: "", actividades: [] },
        ];
      }

      setConfigBase(cfg);
      setDias(diasCargados);
      setDiaActivo(diasCargados[0]?.id ?? "");
    } catch {
      setError("Error de conexion al cargar itinerario.");
    } finally {
      setLoading(false);
    }
  }, [viajeId]);

  useEffect(() => { loadItinerario(); }, [loadItinerario]);

  const [configBase, setConfigBase] = useState<Record<string, unknown>>({});

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const res = await fetchDjango(`/viajes/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: { ...configBase, itinerario: dias } }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else { alert("Error al guardar itinerario."); }
    } finally { setSaving(false); }
  };

  const addActividad = () => {
    const nueva: Actividad = {
      id: `a-${Date.now()}`, hora: "10:00", horaLabel: "Hora estimada",
      titulo: "Nueva Actividad", descripcion: "", estado: "pendiente", tipo: "actividad",
    };
    setDias(prev => prev.map(d =>
      d.id === diaActivo ? { ...d, actividades: [...d.actividades, nueva] } : d
    ));
  };

  const eliminarActividad = (actId: string) => {
    setDias(prev => prev.map(d =>
      d.id === diaActivo ? { ...d, actividades: d.actividades.filter(a => a.id !== actId) } : d
    ));
  };

  const guardarEdicion = () => {
    if (!editando) return;
    setDias(prev => prev.map(d =>
      d.id === diaActivo
        ? { ...d, actividades: d.actividades.map(a => a.id === editando.id ? editando : a) }
        : d
    ));
    setEditando(null);
  };

  const dia = dias.find(d => d.id === diaActivo);

  if (loading) return (
    <div className="bg-white rounded-xl border border-[#E0E4EF] p-12 flex items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-[#5B4FE8]" />
      <span className="text-[13px] text-[#aaa]">Cargando itinerario...</span>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
      <p className="text-[13px] text-red-500">{error}</p>
      <button onClick={loadItinerario} className="mt-3 text-[12px] text-[#5B4FE8] font-semibold hover:underline">Reintentar</button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
      {/* HEADER */}
      <div className="bg-white px-6 py-4 border-b border-[#E8E3F5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/admin/viajes/${viajeId}`} className="p-1.5 text-[#aaa] hover:text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-[16px] font-extrabold text-[#1a1a2e] tracking-tight">Gestion de Itinerario</span>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-[11px] text-[#1D9E75] font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Guardado</span>}
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[12px] font-bold hover:bg-[#4a3fd0] transition disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      <div className="flex min-h-[600px]">
        {/* SIDEBAR DIAS */}
        <div className="w-44 bg-white border-r border-[#e8e3f5] flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-[#e8e3f5]">
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Plan de Dias</p>
          </div>
          <div className="flex-1 py-1 overflow-y-auto">
            {dias.map(d => {
              const conf = d.actividades.filter(a => a.estado === "confirmado").length;
              const pend = d.actividades.filter(a => a.estado === "pendiente").length;
              return (
                <button
                  key={d.id}
                  onClick={() => setDiaActivo(d.id)}
                  className={`w-full text-left px-4 py-3 border-l-2 transition ${diaActivo === d.id ? "bg-[#f0edf8] border-[#5B4FE8]" : "border-transparent hover:bg-[#faf9ff]"}`}
                >
                  <p className={`text-[12px] font-bold ${diaActivo === d.id ? "text-[#5B4FE8]" : "text-[#1a1a2e]"}`}>Dia {d.numero}</p>
                  <p className={`text-[10px] mt-0.5 ${diaActivo === d.id ? "text-[#5B4FE8]/80" : "text-[#aaa]"}`}>{d.fecha}</p>
                  {(conf > 0 || pend > 0) && (
                    <div className="flex gap-1 mt-1.5">
                      {conf > 0 && <span className="text-[9px] bg-[#1D9E75] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">{conf}</span>}
                      {pend > 0 && <span className="text-[9px] bg-[#BA7517] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">{pend}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENIDO DIA */}
        <div className="flex-1 bg-[#f0edf8] p-5 overflow-y-auto">
          {dia && (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-[14px] font-extrabold text-[#1a1a2e]">
                    Dia {dia.numero}{dia.titulo ? `: ${dia.titulo}` : ` — ${dia.fecha}`}
                  </h2>
                  {dia.subtitulo && <p className="text-[11px] text-[#aaa] mt-0.5">{dia.subtitulo}</p>}
                </div>
                <button className="p-1.5 text-[#aaa] hover:bg-white rounded-lg transition">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {dia.actividades.length === 0 && (
                <div className="bg-white rounded-xl border border-dashed border-[#c5bff5] p-8 text-center mb-3">
                  <Coffee className="h-8 w-8 text-[#ddd] mx-auto mb-2" />
                  <p className="text-[12px] text-[#aaa]">Sin actividades para este dia.</p>
                  <p className="text-[11px] text-[#ccc]">Usa el boton de abajo para agregar.</p>
                </div>
              )}

              <div className="space-y-3">
                {dia.actividades.map(act => {
                  const estilo = ESTADO[act.estado] ?? ESTADO.pendiente;
                  const tipoInfo = TIPO[act.tipo] ?? TIPO.actividad;
                  const TipoIcon = tipoInfo.icon;
                  return (
                    <div key={act.id} className="bg-white rounded-xl border border-[#ede9f8] overflow-hidden hover:shadow-[0_2px_12px_rgba(91,79,232,0.08)] transition-shadow">
                      <div className="h-1" style={{ background: tipoInfo.barColor }} />
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className={`h-10 w-10 rounded-xl ${tipoInfo.bg} flex items-center justify-center`}>
                              <TipoIcon className={`h-5 w-5 ${tipoInfo.color}`} />
                            </div>
                            <div>
                              <p className="text-[18px] font-extrabold text-[#1a1a2e] leading-none">{act.hora}</p>
                              {act.horaLabel && <p className="text-[9px] text-[#aaa] mt-0.5">{act.horaLabel}</p>}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-[13px] font-bold text-[#1a1a2e]">{act.titulo}</h3>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button onClick={() => setEditando({...act})} className="p-1.5 text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition">
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => eliminarActividad(act.id)}
                                  className="p-1.5 text-[#aaa] hover:text-[#a32d2d] hover:bg-[#fcebeb] rounded-lg transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 mb-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${estilo.bg} ${estilo.text}`}>
                                {act.estado === "confirmado" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                {estilo.label}
                              </span>
                              {act.lugar && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-[#888] bg-[#f5f3fb] px-2 py-0.5 rounded-full border border-[#ede9f8]">
                                  <MapPin className="h-3 w-3 text-[#5B4FE8]" /> {act.lugar}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#666] leading-relaxed">{act.descripcion}</p>
                            {act.asignados && act.asignados.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex -space-x-1">
                                  {act.asignados.map((a, i) => (
                                    <div key={i} className="h-6 w-6 rounded-full bg-[#eeedfe] border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#3c3489]">{a[0]}</div>
                                  ))}
                                </div>
                                <span className="text-[10px] text-[#aaa]">Asignados: {act.asignados.join(" y ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={addActividad}
                  className="w-full border-2 border-dashed border-[#c5bff5] rounded-xl py-3.5 text-[12px] text-[#5B4FE8] font-semibold hover:bg-white transition flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Anadir Actividad
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL EDICION ACTIVIDAD */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-extrabold text-[#1a1a2e]">Editar Actividad</h3>
              <button onClick={() => setEditando(null)} className="p-1.5 text-[#aaa] hover:text-[#555] rounded-lg transition">
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Título</label>
                <input value={editando.titulo} onChange={e => setEditando(p => p ? {...p, titulo: e.target.value} : p)} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Hora</label>
                  <input type="time" value={editando.hora} onChange={e => setEditando(p => p ? {...p, hora: e.target.value} : p)} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Tipo</label>
                  <select value={editando.tipo} onChange={e => setEditando(p => p ? {...p, tipo: e.target.value} : p)} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] bg-white">
                    <option value="actividad">Actividad</option>
                    <option value="traslado">Traslado</option>
                    <option value="hotel">Hotel</option>
                    <option value="evento">Evento</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Estado</label>
                <select value={editando.estado} onChange={e => setEditando(p => p ? {...p, estado: e.target.value as EstadoActividad} : p)} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] bg-white">
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Lugar</label>
                <input value={editando.lugar ?? ""} onChange={e => setEditando(p => p ? {...p, lugar: e.target.value} : p)} placeholder="Ej: Hotel Marriott, Terminal 2..." className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Descripción</label>
                <textarea value={editando.descripcion} onChange={e => setEditando(p => p ? {...p, descripcion: e.target.value} : p)} rows={3} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] resize-none" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditando(null)} className="rounded-lg border border-[#ede9f8] px-4 py-2 text-[11px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">Cancelar</button>
              <button onClick={guardarEdicion} className="rounded-lg bg-[#5B4FE8] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#4a3fd0] transition">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}