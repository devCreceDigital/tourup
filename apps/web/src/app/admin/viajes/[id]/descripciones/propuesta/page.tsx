"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { ThumbsUp, Plus, Save, Trash2, Star, Loader2, CheckCircle2 } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

type PropuestaItem = {
  id: string;
  titulo: string;
  descripcion: string;
  destacada: boolean;
};

const PROPUESTAS_DEFAULT: PropuestaItem[] = [
  {
    id: "p1",
    titulo: "Itinerario diseñado para promociones",
    descripcion: "Actividades equilibradas entre cultura, integración y recreación para grupos escolares.",
    destacada: true,
  },
  {
    id: "p2",
    titulo: "Acompañamiento operativo completo",
    descripcion: "Asesor dedicado, seguimiento de pagos y soporte de documentación antes y durante el viaje.",
    destacada: false,
  },
];

export default function DescripcionesPropuestaPage() {
  const { id: viajeId } = useParams<{ id: string }>();
  const [items, setItems] = useState<PropuestaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configBase, setConfigBase] = useState<Record<string, unknown>>({});
  const [nuevo, setNuevo] = useState({ titulo: "", descripcion: "", destacada: false });
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await requestTotemApi(`/trips/${viajeId}/`);
      const data = await res.json();
      const cfg = (data.configuracion ?? {}) as Record<string, unknown>;
      setConfigBase(cfg);
      setItems(Array.isArray(cfg.propuesta) ? (cfg.propuesta as PropuestaItem[]) : PROPUESTAS_DEFAULT);
    } catch (e) {
      console.error(e);
      setItems(PROPUESTAS_DEFAULT);
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

  const agregar = () => {
    if (!nuevo.titulo.trim() || !nuevo.descripcion.trim()) return;
    setItems((prev) => [{ id: `p-${Date.now()}`, ...nuevo }, ...prev]);
    setNuevo({ titulo: "", descripcion: "", destacada: false });
    setShowForm(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await requestTotemApi(`/trips/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: { ...configBase, propuesta: items } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E0E4EF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-[#5B5BDB]" />
            <span className="text-[14px] font-bold text-[#1E1E4E]">Propuesta de valor</span>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-[#5B5BDB] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4848C0] transition inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo bloque
          </button>
        </div>

        <div className="p-4 space-y-3">
          {showForm ? (
            <div className="rounded-[8px] border border-[#E0E4EF] bg-[#F5F6FB] p-3 space-y-3">
              <input
                value={nuevo.titulo}
                onChange={(e) => setNuevo((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Título de propuesta"
                className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB]"
              />
              <textarea
                value={nuevo.descripcion}
                onChange={(e) => setNuevo((prev) => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción corta para la landing del viaje"
                rows={3}
                className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB] resize-none"
              />
              <label className="inline-flex items-center gap-2 text-[12px] text-[#666]">
                <input
                  type="checkbox"
                  checked={nuevo.destacada}
                  onChange={(e) => setNuevo((prev) => ({ ...prev, destacada: e.target.checked }))}
                />
                Marcar como destacada
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-[#E0E4EF] bg-white px-3 py-2 text-[12px] font-semibold text-[#666] hover:bg-[#FAFBFF]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={agregar}
                  className="rounded-md bg-[#5B5BDB] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#4848C0] inline-flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  Guardar bloque
                </button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-8 text-[#888] text-[13px]">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cargando…
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-[8px] border border-[#E0E4EF] bg-white px-3 py-3 hover:border-[#5B5BDB] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-[#1E1E4E]">{item.titulo}</h4>
                      {item.destacada ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[10px] bg-[#FFF3E0] text-[#E07800]">
                          <Star className="h-3 w-3" />
                          Destacada
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[12px] text-[#666]">{item.descripcion}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((it) => it.id !== item.id))}
                    className="text-[#E05252] hover:text-[#C04040]"
                    title="Eliminar bloque"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))
          )}
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
          {saved ? "Guardado" : "Guardar propuesta"}
        </button>
      </div>
    </div>
  );
}
