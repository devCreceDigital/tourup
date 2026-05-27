"use client";
import Link from "next/link";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Shield, Plus, Save, Trash2, Loader2, CheckCircle2, Star, SlidersHorizontal , ArrowLeft} from "lucide-react";
import { fetchDjango } from "@/lib/api";

type Servicio = {
  id: string;
  nombre: string;
  incluido: boolean;
  detalle: string;
  precio?: number;
  activo?: boolean;
  recomendado?: boolean;
  icono?: string;
};

const SERVICIOS_DEFAULT: Servicio[] = [
  { id: "s1", nombre: "Seguro de Cancelación y Rescate High-Alt", incluido: false, detalle: "Cobertura total para cancelaciones por motivos médicos y evacuación en helicóptero por encima de los 5.000m.", precio: 185, activo: true, recomendado: true },
  { id: "s2", nombre: "Sesión Fotográfica en Kala Patthar", incluido: false, detalle: "Fotógrafo profesional para capturar el amanecer frente al Everest. Incluye 20 fotos editadas en alta resolución.", precio: 75, activo: false, recomendado: false },
  { id: "s3", nombre: "Suplemento Habitación Individual", incluido: false, detalle: "Habitación privada durante la estancia en Katmandú y Namche Bazaar (sujeto a disponibilidad en lodges de altura).", precio: 420, activo: true, recomendado: false },
  { id: "s4", nombre: "Alquiler de Saco de Dormir -30ºC", incluido: false, detalle: "Saco de expedición técnica de pluma. Incluye limpieza profesional post-uso.", precio: 60, activo: true, recomendado: false },
];

const ICONOS = ["🛡️", "📷", "🏨", "🛏️", "🎒", "🚌", "🍽️", "🏔️"];

export default function ViajeServiciosPage() {
  const { id: viajeId } = useParams<{ id: string }>();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [nuevo, setNuevo] = useState({ nombre: "", detalle: "", incluido: false, precio: 0, activo: true, recomendado: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [configBase, setConfigBase] = useState<Record<string, unknown>>({});

  const loadData = useCallback(async () => {
    try {
      const res = await fetchDjango(`/viajes/${viajeId}/`);
      const data = await res.json();
      const cfg = (data.configuracion ?? {}) as Record<string, unknown>;
      setConfigBase(cfg);
      setServicios(Array.isArray(cfg.servicios) ? (cfg.servicios as Servicio[]) : SERVICIOS_DEFAULT);
    } catch (e) {
      console.error(e);
      setServicios(SERVICIOS_DEFAULT);
    } finally {
      setLoading(false);
    }
  }, [viajeId]);

  useEffect(() => {
    if (!viajeId) return;
    const t = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(t);
  }, [viajeId, loadData]);

  const agregar = () => {
    if (!nuevo.nombre.trim()) return;
    setServicios(prev => [{ id: `s-${Date.now()}`, ...nuevo }, ...prev]);
    setNuevo({ nombre: "", detalle: "", incluido: false, precio: 0, activo: true, recomendado: false });
    setShowForm(false);
  };

  const toggleActivo = (id: string) => {
    setServicios(prev => prev.map(s => s.id === id ? { ...s, activo: !s.activo } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchDjango(`/viajes/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: { ...configBase, servicios } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const activos = servicios.filter(s => s.activo);
  const totalValor = activos.reduce((sum, s) => sum + (s.precio ?? 0), 0);

  const id = viajeId ?? "";
  return (
    <div className="space-y-0">
      <div className="bg-white border-b border-[#E0E4EF] px-4 py-2 flex items-center gap-2">
        <Link href={`/admin/viajes/${id}`} className="p-1.5 text-[#aaa] hover:text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-[11px] text-[#aaa]">Volver al viaje</span>
      </div>
      <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)] flex flex-col min-h-[600px]">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-[#E8E3F5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#5B4FE8]" />
          <span className="text-[16px] font-extrabold text-[#1a1a2e] tracking-tight">Complementos Opcionales</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 border border-[#ede9f8] rounded-lg px-3 py-1.5 text-[11px] font-semibold text-[#666] hover:bg-[#f0edf8] transition">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[12px] font-bold hover:bg-[#4a3fd0] transition">
            <Plus className="h-3.5 w-3.5" /> Añadir complemento
          </button>
        </div>
      </div>

      <div className="p-5 bg-[#f0edf8] flex-1 space-y-3">
        {/* Descripción */}
        <p className="text-[12px] text-[#aaa]">Gestiona los servicios adicionales disponibles para esta expedición.</p>

        {/* FORMULARIO */}
        {showForm && (
          <div className="bg-white rounded-xl border border-[#5B4FE8]/30 p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del complemento" className="rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] col-span-2" />
              <input value={nuevo.detalle} onChange={e => setNuevo(p => ({ ...p, detalle: e.target.value }))} placeholder="Descripción detallada" className="rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] col-span-2" />
              <input type="number" value={nuevo.precio || ""} onChange={e => setNuevo(p => ({ ...p, precio: Number(e.target.value) }))} placeholder="Precio unitario (€)" className="rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
              <label className="flex items-center gap-2 text-[12px] text-[#666] px-3">
                <input type="checkbox" checked={nuevo.recomendado} onChange={e => setNuevo(p => ({ ...p, recomendado: e.target.checked }))} className="accent-[#5B4FE8]" />
                Marcar como recomendado
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-[#ede9f8] px-4 py-2 text-[12px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">Cancelar</button>
              <button onClick={agregar} className="rounded-lg bg-[#5B4FE8] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#4a3fd0] transition">Guardar complemento</button>
            </div>
          </div>
        )}

        {/* LISTA */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#aaa]">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando servicios…
          </div>
        ) : (
          <div className="space-y-2">
            {servicios.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-[#ede9f8] px-5 py-4 flex items-center gap-4 hover:shadow-[0_2px_12px_rgba(91,79,232,0.08)] transition-shadow">
                {/* Icono */}
                <div className="h-10 w-10 rounded-xl bg-[#f0edf8] flex items-center justify-center flex-shrink-0 text-[18px]">
                  {s.icono ?? "🎒"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-bold text-[#1a1a2e]">{s.nombre}</span>
                    {s.recomendado && (
                      <span className="inline-flex items-center gap-1 bg-[#faeeda] text-[#854f0b] text-[9px] font-bold px-2 py-0.5 rounded-full">
                        <Star className="h-2.5 w-2.5" /> RECOMENDADO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#aaa] leading-relaxed line-clamp-2">{s.detalle}</p>
                </div>

                {/* Precio */}
                <div className="text-right flex-shrink-0 w-28">
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.5px] mb-0.5">Precio Unitario</p>
                  <p className="text-[16px] font-extrabold text-[#1a1a2e]">{s.precio ? `${s.precio.toLocaleString()},00 €` : "—"}</p>
                </div>

                {/* Estado */}
                <div className="flex-shrink-0 w-20 text-right">
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.5px] mb-1">{s.activo ? "ACTIVO" : "INACTIVO"}</p>
                  <button
                    onClick={() => toggleActivo(s.id)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${s.activo ? "bg-[#5B4FE8]" : "bg-[#ddd]"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${s.activo ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* Eliminar */}
                <button onClick={() => setServicios(prev => prev.filter(x => x.id !== s.id))} className="p-1.5 text-[#aaa] hover:text-[#a32d2d] hover:bg-[#fcebeb] rounded-lg transition flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {servicios.length === 0 && (
              <div className="bg-white rounded-xl border border-[#ede9f8] p-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-[#f0edf8] flex items-center justify-center mx-auto mb-3 text-[22px]">🎒</div>
                <p className="text-[13px] font-bold text-[#1a1a2e] mb-1">Sin complementos aún</p>
                <p className="text-[12px] text-[#aaa] mb-4">Añade servicios opcionales para tus viajeros</p>
                <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[12px] font-bold hover:bg-[#4a3fd0] transition">
                  <Plus className="h-3.5 w-3.5" /> Crear nuevo servicio opcional
                </button>
              </div>
            )}

            {/* Crear nuevo link */}
            {servicios.length > 0 && (
              <button onClick={() => setShowForm(true)} className="w-full border-2 border-dashed border-[#c5bff5] rounded-xl py-4 text-[12px] text-[#5B4FE8] font-semibold hover:bg-[#f0edf8] transition flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Crear nuevo servicio opcional
              </button>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t border-[#E8E3F5] bg-white flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Total Complementos</p>
            <p className="text-[13px] font-extrabold text-[#1a1a2e]">{activos.length} Servicios Activos</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px]">Valor Añadido Máximo</p>
            <p className="text-[13px] font-extrabold text-[#1D9E75]">+{totalValor.toLocaleString()},00 €/pax</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || loading} className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white rounded-lg px-5 py-2.5 text-[12px] font-bold hover:bg-[#2d2d4e] transition disabled:opacity-60">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "Guardado ✓" : "Guardar Cambios"}
        </button>
      </div>
    </div>
    </div>
  );
}
