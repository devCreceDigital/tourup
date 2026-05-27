"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { HelpCircle, Plus, Save, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

type FAQItem = {
  id: string;
  pregunta: string;
  respuesta: string;
};

const FAQ_DEFAULT: FAQItem[] = [
  {
    id: "f1",
    pregunta: "¿Qué incluye el paquete base?",
    respuesta: "Transporte, alojamiento, actividades del itinerario y acompañamiento del equipo coordinador.",
  },
  {
    id: "f2",
    pregunta: "¿Cómo se realiza el cronograma de pagos?",
    respuesta: "Se define por cuotas y fechas límite visibles para el apoderado desde su panel.",
  },
];

export default function DescripcionesFaqPage() {
  const { id: viajeId } = useParams<{ id: string }>();
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configBase, setConfigBase] = useState<Record<string, unknown>>({});
  const [showForm, setShowForm] = useState(false);
  const [nuevo, setNuevo] = useState({ pregunta: "", respuesta: "" });

  const loadData = useCallback(async () => {
    try {
      const res = await requestTotemApi(`/trips/${viajeId}/`);
      const data = await res.json();
      const cfg = (data.configuracion ?? {}) as Record<string, unknown>;
      setConfigBase(cfg);
      setItems(Array.isArray(cfg.faq) ? (cfg.faq as FAQItem[]) : FAQ_DEFAULT);
    } catch (e) {
      console.error(e);
      setItems(FAQ_DEFAULT);
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
    if (!nuevo.pregunta.trim() || !nuevo.respuesta.trim()) return;
    setItems((prev) => [{ id: `faq-${Date.now()}`, ...nuevo }, ...prev]);
    setNuevo({ pregunta: "", respuesta: "" });
    setShowForm(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await requestTotemApi(`/trips/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: { ...configBase, faq: items } }),
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
            <HelpCircle className="h-4 w-4 text-[#5B5BDB]" />
            <span className="text-[14px] font-bold text-[#1E1E4E]">Preguntas frecuentes</span>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-[#5B5BDB] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4848C0] inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva pregunta
          </button>
        </div>

        <div className="p-4 space-y-3">
          {showForm ? (
            <div className="rounded-[8px] border border-[#E0E4EF] bg-[#F5F6FB] p-3 space-y-3">
              <input
                value={nuevo.pregunta}
                onChange={(e) => setNuevo((p) => ({ ...p, pregunta: e.target.value }))}
                placeholder="Pregunta"
                className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB]"
              />
              <textarea
                value={nuevo.respuesta}
                onChange={(e) => setNuevo((p) => ({ ...p, respuesta: e.target.value }))}
                placeholder="Respuesta visible para inscritos"
                rows={4}
                className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB] resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-[#E0E4EF] bg-white px-3 py-2 text-[12px] font-semibold text-[#666]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={agregar}
                  className="rounded-md bg-[#5B5BDB] px-3 py-2 text-[12px] font-semibold text-white inline-flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  Añadir
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
              <article key={item.id} className="rounded-[8px] border border-[#E0E4EF] px-3 py-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-[13px] font-bold text-[#1E1E4E]">{item.pregunta}</h4>
                    <p className="text-[12px] text-[#666]">{item.respuesta}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
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
          className="rounded-md bg-[#5B5BDB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#4848C0] transition inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saved ? "Guardado" : "Guardar preguntas"}
        </button>
      </div>
    </div>
  );
}
