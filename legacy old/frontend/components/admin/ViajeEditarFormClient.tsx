"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TripBannerEdit from "@/components/admin/TripBannerEdit";
import StepBar, { type Step } from "@/components/admin/StepBar";
import { Save, Check } from "lucide-react";
import { fetchDjango } from "@/lib/api";
import type { ViajeResumen } from "@/lib/server/viaje";

const STEPS: Step[] = [
  { label: "Datos basicos", status: "done" },
  { label: "Configuracion", status: "active" },
  { label: "Descripciones", status: "pending" },
  { label: "Servicios", status: "pending" },
  { label: "Tarifas", status: "pending" },
];

interface Props {
  viajeId: string;
  viaje: ViajeResumen | null;
}

export default function ViajeEditarFormClient({ viajeId, viaje }: Props) {
  const router = useRouter();
  const cfg = viaje?.configuracion ?? {};

  const [form, setForm] = useState({
    nombre: viaje?.nombre ?? "",
    tituloPublico: (cfg.titulo_publico as string) ?? "",
    codigoInterno: viaje?.codigo ?? (viaje?.slug ?? ""),
    estado: viaje?.estado ?? "borrador",
    inscripcionesEstado: (cfg.inscripciones_estado as string) ?? "activas",
    tipoAcceso: (cfg.tipo_acceso as string) ?? "codigo",
    fechaInicio: viaje?.fecha_inicio ?? "",
    fechaFin: viaje?.fecha_fin ?? "",
    validezPropuesta: (cfg.validez_propuesta as string) ?? "",
    cuposMax: viaje?.cupos != null ? String(viaje.cupos) : "",
    cuposMin: (cfg.cupos_min as string) ?? "",
    responsable: (cfg.responsable as string) ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchDjango(`/viajes/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          estado: form.estado,
          fecha_inicio: form.fechaInicio || null,
          fecha_fin: form.fechaFin || null,
          cupos: form.cuposMax ? Number(form.cuposMax) : null,
          configuracion: {
            ...cfg,
            titulo_publico: form.tituloPublico,
            inscripciones_estado: form.inscripcionesEstado,
            tipo_acceso: form.tipoAcceso,
            validez_propuesta: form.validezPropuesta || null,
            cupos_min: form.cuposMin ? Number(form.cuposMin) : null,
            responsable: form.responsable || null,
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header con botones */}
      <div className="bg-white px-5 py-3 border-b border-[#E0E4EF] flex items-center justify-between flex-wrap gap-2">
        <span className="text-[16px] font-bold text-[#1E1E4E]">Viajes: Editar viaje</span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-[10px] bg-[#E3F9EC] px-2.5 py-1 text-[11px] font-bold text-[#1A8A4A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1A8A4A]"></span>
            {viaje?.estado ?? "—"}
          </span>
          <button
            type="button"
            onClick={() => router.push(`/admin/viajes/${viajeId}`)}
            className="rounded-md border border-[#5B5BDB] bg-transparent px-3 py-1.5 text-[11px] font-semibold text-[#5B5BDB] hover:bg-[#ECE6FB] transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-[#5B5BDB] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#4848C0] transition inline-flex items-center gap-1 disabled:opacity-70"
          >
            {saved ? (
              <><Check className="h-3.5 w-3.5" /> Guardado</>
            ) : (
              <><Save className="h-3.5 w-3.5" /> Guardar cambios</>
            )}
          </button>
        </div>
      </div>

      <TripBannerEdit
        nombre={form.nombre || "—"}
        hint='Todos los cambios se guardan al hacer clic en "Guardar cambios"'
      />

      <div className="p-5 bg-[#EEF0F8]">
        <StepBar steps={STEPS} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Columna izquierda */}
          <div className="space-y-4">
            {/* Datos basicos */}
            <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0E4EF] flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#1E1E4E]">Datos basicos</span>
                <span className="inline-flex items-center gap-1 rounded-[10px] bg-[#E3F9EC] px-2.5 py-1 text-[11px] font-bold text-[#1A8A4A]">
                  Completado
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Nombre interno *</label>
                  <input
                    value={form.nombre}
                    onChange={set("nombre")}
                    className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none transition focus:border-[#5B5BDB]"
                  />
                  <div className="text-[11px] text-[#888] mt-1">Solo visible para la agencia</div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Titulo publico</label>
                  <input
                    value={form.tituloPublico}
                    onChange={set("tituloPublico")}
                    className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] outline-none transition focus:border-[#5B5BDB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Codigo interno</label>
                  <input
                    value={form.codigoInterno}
                    onChange={set("codigoInterno")}
                    className="w-full rounded-md border border-[#E0E4EF] px-3 py-2 text-[13px] font-mono outline-none transition focus:border-[#5B5BDB]"
                  />
                </div>
              </div>
            </div>

            {/* Estado y visibilidad */}
            <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0E4EF]">
                <span className="text-[13px] font-bold text-[#1E1E4E]">Estado y visibilidad</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Estado del viaje</label>
                    <select
                      value={form.estado}
                      onChange={set("estado")}
                      className="w-full rounded-md border border-[#E0E4EF] px-2.5 py-1.5 text-[12px] outline-none transition focus:border-[#5B5BDB]"
                    >
                      <option value="publicado">● Activo</option>
                      <option value="borrador">Borrador</option>
                      <option value="archivado">Archivado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Inscripciones</label>
                    <select
                      value={form.inscripcionesEstado}
                      onChange={set("inscripcionesEstado")}
                      className="w-full rounded-md border border-[#E0E4EF] px-2.5 py-1.5 text-[12px] outline-none transition focus:border-[#5B5BDB]"
                    >
                      <option value="activas">● Activas</option>
                      <option value="cerradas">Cerradas</option>
                      <option value="codigo">Por codigo</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Tipo de acceso</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "codigo", label: "Por codigo" },
                      { value: "publico", label: "Publico" },
                      { value: "privado", label: "Privado" },
                    ].map(({ value, label }) => (
                      <label
                        key={value}
                        className="inline-flex items-center gap-1.5 text-[12px] cursor-pointer rounded-md border border-[#E0E4EF] px-2.5 py-1.5 hover:bg-[#F5F6FB]"
                      >
                        <input
                          type="radio"
                          name="tipo-acceso"
                          value={value}
                          checked={form.tipoAcceso === value}
                          onChange={set("tipoAcceso")}
                          className="accent-[#5B5BDB]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            {/* Fechas */}
            <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0E4EF]">
                <span className="text-[13px] font-bold text-[#1E1E4E]">Fechas</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Fecha inicio</label>
                    <input
                      type="date"
                      value={form.fechaInicio}
                      onChange={set("fechaInicio")}
                      className="w-full rounded-md border border-[#E0E4EF] px-2.5 py-1.5 text-[12px] outline-none transition focus:border-[#5B5BDB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Fecha fin</label>
                    <input
                      type="date"
                      value={form.fechaFin}
                      onChange={set("fechaFin")}
                      className="w-full rounded-md border border-[#E0E4EF] px-2.5 py-1.5 text-[12px] outline-none transition focus:border-[#5B5BDB]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Validez de la propuesta</label>
                  <input
                    type="date"
                    value={form.validezPropuesta}
                    onChange={set("validezPropuesta")}
                    className="w-full rounded-md border border-[#E0E4EF] px-2.5 py-1.5 text-[12px] outline-none transition focus:border-[#5B5BDB]"
                  />
                </div>
              </div>
            </div>

            {/* Aforo */}
            <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0E4EF]">
                <span className="text-[13px] font-bold text-[#1E1E4E]">Aforo / Cupos</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Plazas maximas</label>
                    <input
                      type="number"
                      value={form.cuposMax}
                      onChange={set("cuposMax")}
                      placeholder="Sin limite"
                      className="w-full rounded-md border border-[#E0E4EF] px-2.5 py-1.5 text-[12px] outline-none transition focus:border-[#5B5BDB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Plazas minimas</label>
                    <input
                      type="number"
                      value={form.cuposMin}
                      onChange={set("cuposMin")}
                      placeholder="-"
                      className="w-full rounded-md border border-[#E0E4EF] px-2.5 py-1.5 text-[12px] outline-none transition focus:border-[#5B5BDB]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Responsable */}
            <div className="bg-white rounded-[8px] border border-[#E0E4EF] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0E4EF]">
                <span className="text-[13px] font-bold text-[#1E1E4E]">Responsable</span>
              </div>
              <div className="p-4">
                <label className="block text-[11px] font-bold text-[#666] uppercase tracking-wide mb-1">Profesor / Guia / Coordinador</label>
                <select
                  value={form.responsable}
                  onChange={set("responsable")}
                  className="w-full rounded-md border border-[#E0E4EF] px-2.5 py-1.5 text-[12px] outline-none transition focus:border-[#5B5BDB] cursor-pointer"
                >
                  <option value="">Sin responsable asignado</option>
                  <option value="Sandra Quevedo Sanchez">Sandra Quevedo Sanchez</option>
                  <option value="Carlos Sanchez">Carlos Sanchez</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de pasos */}
        <div className="flex justify-between mt-5">
          <button
            type="button"
            onClick={() => router.push(`/admin/viajes/${viajeId}`)}
            className="rounded-md border border-[#E0E4EF] bg-white px-4 py-2 text-[12px] font-semibold text-[#666] hover:bg-[#F5F6FB] transition"
          >
            ← Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-[#5B5BDB] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#4848C0] transition inline-flex items-center gap-1 disabled:opacity-70"
          >
            {saved ? "✓ Guardado" : "Guardar cambios →"}
          </button>
        </div>
      </div>
    </>
  );
}
