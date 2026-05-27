"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Calendar, Plus, X, Trash2, Save, Loader2, CheckCircle2 } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

type FechaTipo = "viaje" | "pago" | "doc" | "custom";

type FechaItem = {
  id: string;
  fecha: string;
  tipo: FechaTipo;
  descripcion: string;
};

const FECHAS_DEFAULT: FechaItem[] = [
  { id: "f1", fecha: "2026-08-13", tipo: "viaje", descripcion: "Inicio de viaje" },
  { id: "f2", fecha: "2026-08-13", tipo: "pago", descripcion: "Reserva — fecha limite" },
  { id: "f3", fecha: "2026-07-01", tipo: "pago", descripcion: "Segundo pago" },
  { id: "f4", fecha: "2026-07-25", tipo: "doc", descripcion: "Entrega documentacion" },
];

const TIPO_STYLES: Record<FechaTipo, { bg: string; text: string; label: string }> = {
  viaje: { bg: "bg-[#E0FAF6]", text: "text-[#007A6E]", label: "Viaje" },
  pago: { bg: "bg-[#FFF3E0]", text: "text-[#E07800]", label: "Pago" },
  doc: { bg: "bg-[#ECE6FB]", text: "text-[#5B5BDB]", label: "Doc" },
  custom: { bg: "bg-[#F0F2F5]", text: "text-[#666]", label: "Custom" },
};

export default function FechasRecordarPage() {
  const { id: viajeId } = useParams<{ id: string }>();
  const [fechas, setFechas] = useState<FechaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configBase, setConfigBase] = useState<Record<string, unknown>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<FechaTipo>("custom");
  const [nuevaDesc, setNuevaDesc] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await requestTotemApi(`/trips/${viajeId}/`);
      const data = await res.json();
      const cfg = (data.configuracion ?? {}) as Record<string, unknown>;
      setConfigBase(cfg);
      setFechas(Array.isArray(cfg.fechas_recordar) ? (cfg.fechas_recordar as FechaItem[]) : FECHAS_DEFAULT);
    } catch (e) {
      console.error(e);
      setFechas(FECHAS_DEFAULT);
    } finally {
      setLoading(false);
    }
  }, [viajeId]);

  useEffect(() => {
    if (!viajeId) return;
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [viajeId, loadData]);

  const fechasOrdenadas = [...fechas].sort((a, b) => a.fecha.localeCompare(b.fecha));

  const formatFecha = (iso: string): string => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleAgregar = () => {
    if (!nuevaFecha || !nuevaDesc.trim()) return;
    setFechas((prev) => [
      ...prev,
      { id: "f" + Date.now(), fecha: nuevaFecha, tipo: nuevoTipo, descripcion: nuevaDesc.trim() },
    ]);
    setNuevaFecha("");
    setNuevoTipo("custom");
    setNuevaDesc("");
    setModalOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await requestTotemApi(`/trips/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: { ...configBase, fechas_recordar: fechas } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  return (
    <>
      <div className="space-y-4">
        <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E0E4EF] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#5B5BDB]" />
            <span className="text-[14px] font-bold text-[#1E1E4E]">Fechas a recordar</span>
          </div>

          <div className="p-4">
            <div className="mb-3">
              <span className="text-[13px] font-bold text-[#1E1E4E]">Listado</span>
              <p className="text-[12px] text-[#888] mt-1">
                Por defecto se anaden las fechas configuradas para pagos e inicio de viaje como referencia.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-[#888] text-[13px]">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cargando…
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {fechasOrdenadas.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[#E0E4EF] bg-[#F5F6FB] p-6 text-center text-[12px] text-[#888]">
                    Sin fechas registradas. Agrega una nueva con el boton de abajo.
                  </div>
                ) : (
                  fechasOrdenadas.map((item) => {
                    const tipoStyle = TIPO_STYLES[item.tipo];
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-md border border-[#E0E4EF] bg-[#FAFBFF] px-3 py-2.5 hover:border-[#5B5BDB] transition group"
                      >
                        <span className="text-[#888]">→</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E0E4EF] px-2 py-1 text-[11px] font-mono text-[#222]">
                          <Calendar className="h-3 w-3 text-[#888]" />
                          {formatFecha(item.fecha)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-[10px] px-2 py-0.5 text-[10px] font-bold ${tipoStyle.bg} ${tipoStyle.text}`}
                        >
                          {tipoStyle.label}
                        </span>
                        <span className="flex-1 text-[12px] text-[#222] font-medium">
                          {item.descripcion}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFechas((prev) => prev.filter((f) => f.id !== item.id))}
                          className="opacity-0 group-hover:opacity-100 text-[#E05252] hover:text-[#C04040] transition"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-md bg-[#5B5BDB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#4848C0] transition inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Nueva fecha
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-md bg-[#5B5BDB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#4848C0] transition inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saved ? "Guardado" : "Guardar fechas"}
          </button>
        </div>
      </div>

      {/* Modal Nueva fecha */}
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1E4E]/60 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-[12px] border border-[#E0E4EF] bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E4EF]">
              <h3 className="text-[15px] font-bold text-[#1E1E4E]">Anadir fecha a recordar</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1.5 text-[#888] hover:bg-[#F5F6FB] hover:text-[#1E1E4E] transition"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none transition focus:border-[#5B5BDB]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">
                  Tipo
                </label>
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as FechaTipo)}
                  className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none transition focus:border-[#5B5BDB] cursor-pointer"
                >
                  <option value="viaje">Viaje</option>
                  <option value="pago">Pago</option>
                  <option value="doc">Documentacion</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">
                  Descripcion
                </label>
                <input
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                  placeholder="Ej: Entrega de documentacion"
                  className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none transition focus:border-[#5B5BDB]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E0E4EF] bg-[#F5F6FB]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-[#E0E4EF] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#666] hover:bg-[#FAFBFF] transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAgregar}
                disabled={!nuevaFecha || !nuevaDesc.trim()}
                className="rounded-md bg-[#5B5BDB] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#4848C0] transition inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-3.5 w-3.5" /> Añadir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
