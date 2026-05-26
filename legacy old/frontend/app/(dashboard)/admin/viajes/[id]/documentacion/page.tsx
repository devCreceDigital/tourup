"use client";
import Link from "next/link";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Folder, Plus, Save, Trash2, CheckCircle2 , ArrowLeft} from "lucide-react";
import { fetchDjango } from "@/lib/api";

type Requisito = {
  id: string;
  nombre: string;
  obligatorio: boolean;
  descripcion: string;
};

export default function ViajeDocumentacionPage() {
  const params = useParams<{ id: string }>();
  const viajeId = params?.id ?? "";

  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [configuracion, setConfiguracion] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", obligatorio: true });

  useEffect(() => {
    if (!viajeId) return;
    const load = async () => {
      try {
        const res = await fetchDjango(`/viajes/${viajeId}/`);
        const viaje = await res.json();
        const cfg: Record<string, unknown> = viaje.configuracion ?? {};
        setConfiguracion(cfg);
        const reqs = Array.isArray(cfg.documentos_requeridos) ? (cfg.documentos_requeridos as Requisito[]) : [];
        setRequisitos(reqs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [viajeId]);

  const agregar = () => {
    if (!nuevo.nombre.trim()) return;
    const req: Requisito = { id: `r-${Date.now()}`, ...nuevo };
    setRequisitos((prev) => [...prev, req]);
    setNuevo({ nombre: "", descripcion: "", obligatorio: true });
  };

  const eliminar = (id: string) => {
    setRequisitos((prev) => prev.filter((r) => r.id !== id));
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const nuevaConfig = { ...configuracion, documentos_requeridos: requisitos };
      await fetchDjango(`/viajes/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: nuevaConfig }),
      });
      setConfiguracion(nuevaConfig);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  
  return (
    <div className="space-y-0">
      <div className="bg-white border-b border-[#E0E4EF] px-4 py-2 flex items-center gap-2">
        <Link href={`/admin/viajes/${viajeId}`} className="p-1.5 text-[#aaa] hover:text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-[11px] text-[#aaa]">Volver al viaje</span>
      </div>
      <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.10)]">
      <div className="px-5 py-3 border-b border-[#E0E4EF] flex items-center gap-2">
        <Folder className="h-4 w-4 text-[#5B5BDB]" />
        <span className="text-[16px] font-bold text-[#1E1E4E]">Documentación requerida</span>
      </div>

      <div className="p-5 bg-[#EEF0F8] space-y-4">
        {/* Formulario nuevo requisito */}
        <div className="bg-white rounded-[8px] border border-[#E0E4EF] p-3 space-y-3">
          <input
            value={nuevo.nombre}
            onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Nombre del requisito"
            className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB]"
          />
          <textarea
            value={nuevo.descripcion}
            onChange={(e) => setNuevo((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Descripción del requisito"
            rows={2}
            className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB] resize-none"
          />
          <label className="inline-flex items-center gap-2 text-[12px] text-[#666]">
            <input
              type="checkbox"
              checked={nuevo.obligatorio}
              onChange={(e) => setNuevo((p) => ({ ...p, obligatorio: e.target.checked }))}
              className="accent-[#5B5BDB]"
            />
            Obligatorio
          </label>
          <button
            type="button"
            onClick={agregar}
            className="rounded-md bg-[#5B5BDB] px-3 py-2 text-[12px] font-semibold text-white inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir requisito
          </button>
        </div>

        {/* Lista de requisitos */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-[13px] text-[#888] py-4 text-center">Cargando requisitos…</p>
          ) : requisitos.length === 0 ? (
            <p className="text-[13px] text-[#888] py-4 text-center">
              No hay requisitos definidos. Añade el primero arriba.
            </p>
          ) : (
            requisitos.map((r) => (
              <article
                key={r.id}
                className="bg-white rounded-[8px] border border-[#E0E4EF] px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-[#1E1E4E]">{r.nombre}</h4>
                      {r.obligatorio && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[10px] bg-[#E3F9EC] text-[#1A8A4A]">
                          <CheckCircle2 className="h-3 w-3" />
                          Obligatorio
                        </span>
                      )}
                    </div>
                    {r.descripcion && (
                      <p className="text-[12px] text-[#666]">{r.descripcion}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminar(r.id)}
                    className="text-[#E05252] hover:text-[#C04040] shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={guardar}
            disabled={saving || loading}
            className="rounded-md bg-[#5B5BDB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#4848C0] inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Guardando…" : "Guardar documentación"}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
