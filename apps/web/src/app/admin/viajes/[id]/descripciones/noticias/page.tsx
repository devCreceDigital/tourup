"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Newspaper, Plus, Save, Trash2, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

type NoticiaItem = {
  id: string;
  titulo: string;
  contenido: string;
  fecha: string;
  destacada: boolean;
};

const NOTICIAS_DEFAULT: NoticiaItem[] = [
  {
    id: "n1",
    titulo: "Reunión informativa de padres",
    contenido: "La reunión informativa se realizará el viernes a las 7:00 PM en el auditorio principal.",
    fecha: "2026-06-15",
    destacada: true,
  },
  {
    id: "n2",
    titulo: "Cierre de segundo pago",
    contenido: "Recordatorio: el segundo pago vence el 01/07. Por favor verificar estado en el panel de pagos.",
    fecha: "2026-06-28",
    destacada: false,
  },
];

export default function DescripcionesNoticiasPage() {
  const { id: viajeId } = useParams<{ id: string }>();
  const [noticias, setNoticias] = useState<NoticiaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configBase, setConfigBase] = useState<Record<string, unknown>>({});
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaNoticia, setNuevaNoticia] = useState<Omit<NoticiaItem, "id">>({
    titulo: "",
    contenido: "",
    fecha: "",
    destacada: false,
  });

  const loadData = useCallback(async () => {
    try {
      const res = await requestTotemApi(`/trips/${viajeId}/`);
      const data = await res.json();
      const cfg = (data.configuracion ?? {}) as Record<string, unknown>;
      setConfigBase(cfg);
      setNoticias(Array.isArray(cfg.noticias) ? (cfg.noticias as NoticiaItem[]) : NOTICIAS_DEFAULT);
    } catch (e) {
      console.error(e);
      setNoticias(NOTICIAS_DEFAULT);
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

  const agregarNoticia = () => {
    if (!nuevaNoticia.titulo.trim() || !nuevaNoticia.contenido.trim() || !nuevaNoticia.fecha) return;
    setNoticias((prev) => [{ id: `n-${Date.now()}`, ...nuevaNoticia }, ...prev]);
    setNuevaNoticia({ titulo: "", contenido: "", fecha: "", destacada: false });
    setMostrarFormulario(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await requestTotemApi(`/trips/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: { ...configBase, noticias } }),
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
        <div className="px-4 py-3 border-b border-[#E0E4EF] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-[#5B5BDB]" />
            <span className="text-[14px] font-bold text-[#1E1E4E]">Noticias del viaje</span>
          </div>
          <button
            type="button"
            onClick={() => setMostrarFormulario((v) => !v)}
            className="rounded-md bg-[#5B5BDB] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4848C0] transition inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva noticia
          </button>
        </div>

        <div className="p-4 space-y-4">
          {mostrarFormulario ? (
            <div className="border border-[#E0E4EF] rounded-[8px] bg-[#F5F6FB] p-3 space-y-3">
              <input
                type="text"
                value={nuevaNoticia.titulo}
                onChange={(e) => setNuevaNoticia((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Título de la noticia"
                className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none transition focus:border-[#5B5BDB]"
              />
              <textarea
                value={nuevaNoticia.contenido}
                onChange={(e) => setNuevaNoticia((prev) => ({ ...prev, contenido: e.target.value }))}
                placeholder="Contenido para inscritos"
                rows={4}
                className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none transition focus:border-[#5B5BDB] resize-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={nuevaNoticia.fecha}
                  onChange={(e) => setNuevaNoticia((prev) => ({ ...prev, fecha: e.target.value }))}
                  className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none transition focus:border-[#5B5BDB]"
                />
                <label className="inline-flex items-center gap-2 text-[12px] text-[#666]">
                  <input
                    type="checkbox"
                    checked={nuevaNoticia.destacada}
                    onChange={(e) => setNuevaNoticia((prev) => ({ ...prev, destacada: e.target.checked }))}
                  />
                  Marcar como destacada
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="rounded-md border border-[#E0E4EF] bg-white px-3 py-2 text-[12px] font-semibold text-[#666] hover:bg-[#FAFBFF] transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={agregarNoticia}
                  className="rounded-md bg-[#5B5BDB] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#4848C0] transition inline-flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  Añadir noticia
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
            <div className="space-y-2">
              {noticias.map((noticia) => (
                <article
                  key={noticia.id}
                  className="rounded-[8px] border border-[#E0E4EF] bg-white px-3 py-3 hover:border-[#5B5BDB] transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[13px] font-bold text-[#1E1E4E]">{noticia.titulo}</h4>
                        {noticia.destacada ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-[10px] bg-[#E3F9EC] text-[#1A8A4A]">
                            Destacada
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[12px] text-[#666]">{noticia.contenido}</p>
                      <div className="inline-flex items-center gap-1 text-[11px] text-[#888]">
                        <Calendar className="h-3 w-3" />
                        {noticia.fecha}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNoticias((prev) => prev.filter((n) => n.id !== noticia.id))}
                      className="text-[#E05252] hover:text-[#C04040] transition"
                      title="Eliminar noticia"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
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
          {saved ? "Guardado" : "Guardar noticias"}
        </button>
      </div>
    </div>
  );
}
