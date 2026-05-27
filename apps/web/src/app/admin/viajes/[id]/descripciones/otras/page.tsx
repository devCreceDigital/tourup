"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { FileStack, Plus, Save, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

type BloqueExtra = {
  id: string;
  nombre: string;
  contenido: string;
};

const OTRAS_DEFAULT: BloqueExtra[] = [
  {
    id: "o1",
    nombre: "Recomendaciones de equipaje",
    contenido: "Se sugiere llevar ropa térmica, bloqueador solar y mochila de mano de uso diario.",
  },
];

export default function DescripcionesOtrasPage() {
  const { id: viajeId } = useParams<{ id: string }>();
  const [bloques, setBloques] = useState<BloqueExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configBase, setConfigBase] = useState<Record<string, unknown>>({});
  const [nuevo, setNuevo] = useState({ nombre: "", contenido: "" });

  const loadData = useCallback(async () => {
    try {
      const res = await requestTotemApi(`/trips/${viajeId}/`);
      const data = await res.json();
      const cfg = (data.configuracion ?? {}) as Record<string, unknown>;
      setConfigBase(cfg);
      setBloques(
        Array.isArray(cfg.otras_descripciones) ? (cfg.otras_descripciones as BloqueExtra[]) : OTRAS_DEFAULT
      );
    } catch (e) {
      console.error(e);
      setBloques(OTRAS_DEFAULT);
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
    if (!nuevo.nombre.trim() || !nuevo.contenido.trim()) return;
    setBloques((prev) => [{ id: `o-${Date.now()}`, ...nuevo }, ...prev]);
    setNuevo({ nombre: "", contenido: "" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await requestTotemApi(`/trips/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: { ...configBase, otras_descripciones: bloques } }),
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
        <div className="px-4 py-3 border-b border-[#E0E4EF] flex items-center gap-2">
          <FileStack className="h-4 w-4 text-[#5B5BDB]" />
          <span className="text-[14px] font-bold text-[#1E1E4E]">Otras descripciones</span>
        </div>

        <div className="p-4 space-y-3">
          <div className="rounded-[8px] border border-[#E0E4EF] bg-[#F5F6FB] p-3 space-y-3">
            <input
              value={nuevo.nombre}
              onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Nombre del bloque"
              className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB]"
            />
            <textarea
              value={nuevo.contenido}
              onChange={(e) => setNuevo((p) => ({ ...p, contenido: e.target.value }))}
              placeholder="Contenido adicional para mostrar a inscritos"
              rows={3}
              className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB] resize-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={agregar}
                className="rounded-md bg-[#5B5BDB] px-3 py-2 text-[12px] font-semibold text-white inline-flex items-center gap-1.5 hover:bg-[#4848C0]"
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir bloque
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-[#888] text-[13px]">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cargando…
            </div>
          ) : (
            bloques.map((bloque) => (
              <article key={bloque.id} className="rounded-[8px] border border-[#E0E4EF] px-3 py-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-[13px] font-bold text-[#1E1E4E]">{bloque.nombre}</h4>
                    <p className="text-[12px] text-[#666]">{bloque.contenido}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBloques((prev) => prev.filter((b) => b.id !== bloque.id))}
                    className="text-[#E05252] hover:text-[#C04040]"
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
          className="rounded-md bg-[#5B5BDB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#4848C0] inline-flex items-center gap-1.5 disabled:opacity-60 transition"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
