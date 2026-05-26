"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Type,
  AlignLeft,
  DollarSign,
  Clock,
  AlignJustify,
  Pencil,
  EyeOff,
  ImageIcon,
  GripVertical,
  Plus,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { fetchDjango } from "@/lib/api";

type FieldData = {
  id: string;
  icon: React.ElementType;
  label: string;
  value: string;
  hidden: boolean;
};

const BASIC_FIELD_DEFS: Omit<FieldData, "value">[] = [
  { id: "titulo", icon: Type, label: "Titulo de viaje", hidden: false },
  { id: "subtitulo", icon: AlignLeft, label: "Subtitulo", hidden: true },
  { id: "precio", icon: DollarSign, label: "Precio desde", hidden: true },
  { id: "duracion", icon: Clock, label: "Duracion", hidden: true },
];

const INFO_FIELD_DEFS: Omit<FieldData, "value">[] = [
  { id: "texto_breve", icon: AlignJustify, label: "Texto Breve", hidden: true },
  { id: "texto_extenso", icon: AlignJustify, label: "Texto Extenso", hidden: true },
];

function makeFields(defs: Omit<FieldData, "value">[], values: Record<string, string>): FieldData[] {
  return defs.map((d) => ({ ...d, value: values[d.id] ?? "" }));
}

export default function DescripcionesBasicasPage() {
  const { id: viajeId } = useParams<{ id: string }>();
  const [basicFields, setBasicFields] = useState<FieldData[]>(makeFields(BASIC_FIELD_DEFS, {}));
  const [infoFields, setInfoFields] = useState<FieldData[]>(makeFields(INFO_FIELD_DEFS, {}));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configBase, setConfigBase] = useState<Record<string, unknown>>({});

  const loadData = useCallback(async () => {
    try {
      const res = await fetchDjango(`/viajes/${viajeId}/`);
      const data = await res.json();
      const cfg = (data.configuracion ?? {}) as Record<string, unknown>;
      setConfigBase(cfg);
      const desc = (cfg.descripciones_basicas ?? {}) as Record<string, string>;
      setBasicFields(makeFields(BASIC_FIELD_DEFS, desc));
      setInfoFields(makeFields(INFO_FIELD_DEFS, desc));
    } catch {
      // fall through — fields remain at empty defaults
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

  const updateBasic = (id: string, value: string) =>
    setBasicFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));

  const updateInfo = (id: string, value: string) =>
    setInfoFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));

  const handleSave = async () => {
    setSaving(true);
    const descripciones_basicas = Object.fromEntries(
      [...basicFields, ...infoFields].map((f) => [f.id, f.value])
    );
    try {
      await fetchDjango(`/viajes/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: { ...configBase, descripciones_basicas } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card Informacion */}
      <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E0E4EF] flex items-center gap-2">
          <AlignJustify className="h-4 w-4 text-[#5B5BDB]" />
          <span className="text-[14px] font-bold text-[#1E1E4E]">Informacion</span>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pencil className="h-3.5 w-3.5 text-[#5B5BDB]" />
            <span className="text-[13px] font-bold text-[#1E1E4E]">Informacion publica personalizada</span>
          </div>
          <p className="text-[12px] text-[#888] mb-4">
            Personaliza y anade informacion relevante en la presentacion del viaje.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-[#888] text-[13px]">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cargando…
            </div>
          ) : (
            <>
              {/* Bloque BASICO */}
              <div className="border border-[#E0E4EF] rounded-[8px] overflow-hidden mb-4">
                <div className="bg-[#F5F6FB] px-3 py-2 text-[11px] font-bold text-[#1E1E4E] uppercase tracking-wider border-b border-[#E0E4EF]">
                  BASICO — Anade informacion personalizada
                </div>
                <div className="p-3 space-y-2">
                  {basicFields.map((field) => (
                    <BasicFieldRow
                      key={field.id}
                      field={field}
                      onChange={(v) => updateBasic(field.id, v)}
                    />
                  ))}
                </div>
              </div>

              {/* Bloque INFO */}
              <div className="border border-[#E0E4EF] rounded-[8px] overflow-hidden">
                <div className="bg-[#F5F6FB] px-3 py-2 text-[11px] font-bold text-[#1E1E4E] uppercase tracking-wider border-b border-[#E0E4EF]">
                  INFO — Crea bloques de texto de ayuda/posicionamiento
                </div>
                <div className="p-3 space-y-2">
                  {infoFields.map((field) => (
                    <BasicFieldRow
                      key={field.id}
                      field={field}
                      onChange={(v) => updateInfo(field.id, v)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Imagenes */}
      <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E0E4EF] flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-[#5B5BDB]" />
          <span className="text-[14px] font-bold text-[#1E1E4E]">Imagenes</span>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-3.5 w-3.5 text-[#5B5BDB]" />
            <span className="text-[13px] font-bold text-[#1E1E4E]">
              Imagenes — Modifica o anade imagenes personalizadas
            </span>
          </div>

          {/* Imagen Principal */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <GripVertical className="h-3.5 w-3.5 text-[#888]" />
              <span className="text-[12px] font-bold text-[#1E1E4E]">Principal</span>
            </div>
            <div className="border-2 border-dashed border-[#E0E4EF] rounded-[8px] p-6 text-center hover:border-[#5B5BDB] hover:bg-[#F5F6FB] transition cursor-pointer">
              <ImageIcon className="h-8 w-8 text-[#888] mx-auto mb-2" />
              <div className="text-[12px] text-[#666] font-semibold">Subir imagen principal</div>
              <div className="text-[11px] text-[#888] mt-1">Medidas: 1600 x 260px (o similar)</div>
            </div>
          </div>

          {/* Galeria */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GripVertical className="h-3.5 w-3.5 text-[#888]" />
              <span className="text-[12px] font-bold text-[#1E1E4E]">Galeria</span>
              <span className="text-[11px] text-[#888]">— Hasta 6 imagenes</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-[1000/650] border-2 border-dashed border-[#E0E4EF] rounded-[6px] flex flex-col items-center justify-center hover:border-[#5B5BDB] hover:bg-[#F5F6FB] transition cursor-pointer p-2"
                >
                  <Plus className="h-5 w-5 text-[#888] mb-1" />
                  <div className="text-[9px] text-[#888] text-center">1000x650</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#888] mt-2">
              Si no se sube ninguna, la galeria no se muestra.
            </p>
          </div>
        </div>
      </div>

      {/* Boton Guardar */}
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
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function BasicFieldRow({
  field,
  onChange,
}: {
  field: FieldData;
  onChange: (v: string) => void;
}) {
  const Icon = field.icon;
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#5B5BDB] shrink-0" />
      <input
        value={field.value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.label}
        className="flex-1 rounded-md border border-[#E0E4EF] bg-white px-2.5 py-1.5 text-[12px] outline-none transition focus:border-[#5B5BDB]"
      />
      {field.hidden ? (
        <span
          className="inline-flex items-center gap-1 text-[10px] text-[#888]"
          title="Campo oculto al publico"
        >
          <EyeOff className="h-3 w-3" />
          oculto
        </span>
      ) : null}
      <button
        type="button"
        className="text-[#5B5BDB] opacity-65 hover:opacity-100 transition shrink-0"
        title="Editar"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
