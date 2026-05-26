"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Shield, Save, CheckCircle2, Loader2 } from "lucide-react";
import { fetchDjango } from "@/lib/api";

type SeguridadConfig = {
  seguroAsistencia: boolean;
  monitoreo24h: boolean;
  protocoloEmergencia: boolean;
  fichaMedicaObligatoria: boolean;
  contactoEmergencia: string;
  observaciones: string;
};

const SEGURIDAD_DEFAULT: SeguridadConfig = {
  seguroAsistencia: true,
  monitoreo24h: true,
  protocoloEmergencia: true,
  fichaMedicaObligatoria: true,
  contactoEmergencia: "+51 999 111 222",
  observaciones:
    "Todos los coordinadores cuentan con checklist de seguridad y rutas de atención médica por destino.",
};

export default function DescripcionesSeguridadPage() {
  const { id: viajeId } = useParams<{ id: string }>();
  const [config, setConfig] = useState<SeguridadConfig>(SEGURIDAD_DEFAULT);
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
      if (cfg.seguridad && typeof cfg.seguridad === "object") {
        setConfig({ ...SEGURIDAD_DEFAULT, ...(cfg.seguridad as Partial<SeguridadConfig>) });
      }
    } catch (e) {
      console.error(e);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchDjango(`/viajes/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuracion: { ...configBase, seguridad: config } }),
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
          <Shield className="h-4 w-4 text-[#5B5BDB]" />
          <span className="text-[14px] font-bold text-[#1E1E4E]">Seguridad</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-[#888] text-[13px]">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Cargando…
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Toggle
                label="Seguro de asistencia incluido"
                checked={config.seguroAsistencia}
                onChange={(v) => setConfig((p) => ({ ...p, seguroAsistencia: v }))}
              />
              <Toggle
                label="Monitoreo operativo 24h"
                checked={config.monitoreo24h}
                onChange={(v) => setConfig((p) => ({ ...p, monitoreo24h: v }))}
              />
              <Toggle
                label="Protocolo de emergencia activo"
                checked={config.protocoloEmergencia}
                onChange={(v) => setConfig((p) => ({ ...p, protocoloEmergencia: v }))}
              />
              <Toggle
                label="Ficha médica obligatoria"
                checked={config.fichaMedicaObligatoria}
                onChange={(v) => setConfig((p) => ({ ...p, fichaMedicaObligatoria: v }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#666] uppercase tracking-wide">
                Contacto de emergencia
              </label>
              <input
                value={config.contactoEmergencia}
                onChange={(e) => setConfig((p) => ({ ...p, contactoEmergencia: e.target.value }))}
                className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#666] uppercase tracking-wide">
                Mensaje público de seguridad
              </label>
              <textarea
                value={config.observaciones}
                onChange={(e) => setConfig((p) => ({ ...p, observaciones: e.target.value }))}
                rows={4}
                className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none focus:border-[#5B5BDB] resize-none"
              />
            </div>

            <div className="rounded-[8px] border border-[#E0E4EF] bg-[#F5F6FB] p-3">
              <div className="flex items-center gap-2 text-[12px] text-[#1E1E4E] font-semibold">
                <CheckCircle2 className="h-4 w-4 text-[#1A8A4A]" />
                Recomendación operativa
              </div>
              <p className="text-[12px] text-[#666] mt-1">
                Mantener actualizado el contacto de emergencia y validar documentación médica antes del
                cierre de inscripciones.
              </p>
            </div>
          </div>
        )}
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="rounded-[8px] border border-[#E0E4EF] px-3 py-2 flex items-center justify-between gap-3 text-[12px] text-[#1E1E4E] font-medium">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
