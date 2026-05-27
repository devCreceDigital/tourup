"use client";

import { useState } from "react";
import { Calendar, Link2, FileText, Check, Save, Eye, Info, Lock, Globe, ChevronRight } from "lucide-react";
import Link from "next/link";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { useRouter } from "next/navigation";
import ImageUploader from "@/contexts/platform/ui/admin/ImageUploader";
import type { ViajeResumen } from "@/shared/server/viaje";

interface Props {
  viajeId: string;
  nombre: string;
  viaje: ViajeResumen | null;
}

export default function ViajeEditarBasicoClient({ viajeId, nombre: nombreProp, viaje }: Props) {
  const cfg = viaje?.configuracion ?? {};
  const [nombre, setNombre] = useState(nombreProp);
  const [slug, setSlug] = useState(viaje?.slug ?? "");
  const [slugError, setSlugError] = useState("");

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-");
    setSlug(clean);
    if (clean && !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(clean) && clean.length > 1) {
      setSlugError("Solo letras minúsculas, números y guiones. No puede empezar ni terminar con guión.");
    } else {
      setSlugError("");
    }
  };
  const [codigoRef, setCodigoRef] = useState(viaje?.codigo ?? "");
  const [fechaInicio, setFechaInicio] = useState(viaje?.fecha_inicio ?? "");
  const [fechaFin, setFechaFin] = useState(viaje?.fecha_fin ?? "");
  const [vigencia, setVigencia] = useState((cfg.validez_propuesta as string) ?? "");
  const [estadoGlobal, setEstadoGlobal] = useState(viaje?.estado ?? "borrador");
  const router = useRouter();
  const [tipoAcceso, setTipoAcceso] = useState((cfg.tipo_acceso as string) ?? "codigo");
  const [imagenUrl, setImagenUrl] = useState((cfg.imagen_url as string) ?? "");
  const [tipoViaje, setTipoViaje] = useState((cfg.tipo_viaje as string) ?? "grupal");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (slugError) return;
    setSaving(true);
    try {
      const res = await requestTotemApi(`/trips/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(nombre ? { nombre } : {}),
          ...(slug ? { slug } : {}),
          ...(fechaInicio ? { fecha_inicio: fechaInicio } : {}),
          ...(fechaFin ? { fecha_fin: fechaFin } : {}),
          estado: estadoGlobal,
          configuracion: { ...cfg, validez_propuesta: vigencia || null, tipo_acceso: tipoAcceso, imagen_url: imagenUrl, tipo_viaje: tipoViaje },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.slug) setSlugError(err.slug[0] ?? "Slug inválido");
        return;
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); router.push(`/admin/viajes/${viajeId}`); }, 1500);
    } finally {
      setSaving(false);
    }
  };

  const inscripcionesEstado = (cfg.inscripciones_estado as string) ?? "activas";
  const camposLlenos = [nombre, slug, fechaInicio, fechaFin].filter(Boolean).length;
  const porcentaje = Math.round((camposLlenos / 4) * 100);

  return (
    <div className="p-5 bg-[#f0edf8]">
      {/* BREADCRUMB */}
      <div className="text-[11px] text-[#aaa] mb-4 flex items-center gap-1.5 flex-wrap">
        <Link href="/admin/viajes" className="text-[#5B4FE8] font-semibold hover:underline">Viajes</Link>
        <span className="text-[#ccc]">›</span>
        <Link href={`/admin/viajes/${viajeId}`} className="text-[#5B4FE8] font-semibold hover:underline">{nombreProp}</Link>
        <span className="text-[#ccc]">›</span>
        <span className="text-[#5B4FE8]">Ajustes</span>
        <span className="text-[#ccc]">›</span>
        <span className="text-[#1a1a2e] font-semibold">Básico</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* FORMULARIO — 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* INFORMACIÓN GENERAL */}
          <div className="bg-white rounded-xl border border-[#ede9f8] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f5f3fb] flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#eeedfe] flex items-center justify-center">
                <Info className="h-3.5 w-3.5 text-[#5B4FE8]" />
              </div>
              <span className="text-[13px] font-bold text-[#1a1a2e]">Información General</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Nombre Interno del Viaje</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white" />
                <p className="text-[10px] text-[#aaa] mt-1">Este nombre solo es visible para administradores en el panel de control.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">URL Slug (Identificador)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#aaa] bg-[#f0edf8] border border-[#ede9f8] rounded-l-lg px-2 py-2 border-r-0">totem.com/</span>
                    <input value={slug} onChange={e => handleSlugChange(e.target.value)}
                      className="flex-1 rounded-r-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Código de Referencia Interno</label>
                  <input value={codigoRef} onChange={e => setCodigoRef(e.target.value)}
                    className="w-full rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] font-mono outline-none transition focus:border-[#5B4FE8] focus:bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* FECHAS Y VIGENCIA */}
          <div className="bg-white rounded-xl border border-[#ede9f8] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f5f3fb] flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#e1f5ee] flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-[#1D9E75]" />
              </div>
              <span className="text-[13px] font-bold text-[#1a1a2e]">Fechas y Vigencia</span>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Vigencia Propuesta</label>
                <input type="date" value={vigencia} onChange={e => setVigencia(e.target.value)}
                  className="w-full rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Fecha de Inicio</label>
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                  className="w-full rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Fecha de Finalización</label>
                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                  className="w-full rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white" />
              </div>
            </div>
          </div>

          {/* IMAGEN */}
          <div className="bg-white rounded-xl border border-[#ede9f8] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f5f3fb] flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#faeeda] flex items-center justify-center">
                <span className="text-[14px]">🖼️</span>
              </div>
              <span className="text-[13px] font-bold text-[#1a1a2e]">Imagen del Viaje</span>
            </div>
            <div className="p-5">
              <ImageUploader value={imagenUrl} onChange={setImagenUrl} label="" />
            </div>
          </div>

          {/* TIPO DE VIAJE */}
          <div className="bg-white rounded-xl border border-[#ede9f8] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f5f3fb] flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#e1f5ee] flex items-center justify-center">
                <span className="text-[14px]">👥</span>
              </div>
              <span className="text-[13px] font-bold text-[#1a1a2e]">Modalidad del Viaje</span>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: "grupal", emoji: "👥", label: "Grupal" },
                { value: "individual", emoji: "🧍", label: "Individual" },
                { value: "pareja", emoji: "💑", label: "En Pareja" },
                { value: "familiar", emoji: "👨‍👩‍👧", label: "Familiar" },
              ].map(opt => (
                <button key={opt.value} onClick={() => setTipoViaje(opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${tipoViaje === opt.value ? "border-[#5B4FE8] bg-[#eeedfe]" : "border-[#ede9f8] bg-white hover:bg-[#f5f3fb]"}`}>
                  <span className="text-[20px]">{opt.emoji}</span>
                  <span className={`text-[11px] font-bold ${tipoViaje === opt.value ? "text-[#3c3489]" : "text-[#666]"}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GUARDAR */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-6 py-2.5 text-[12px] font-bold hover:bg-[#4a3fd0] transition disabled:opacity-60">
              {saved ? <><Check className="h-3.5 w-3.5" /> Guardado</> : <><Save className="h-3.5 w-3.5" /> Guardar Cambios</>}
            </button>
          </div>
        </div>

        {/* PANEL LATERAL — 1/3 */}
        <div className="space-y-4">
          {/* Estado del Viaje */}
          <div className="bg-white rounded-xl border border-[#ede9f8] p-5">
            <h3 className="text-[12px] font-bold text-[#1a1a2e] mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1D9E75]" /> Estado del Viaje
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Estado Global</label>
                <select value={estadoGlobal} onChange={e => setEstadoGlobal(e.target.value)}
                  className="w-full rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]">
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Activo</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Estado de Registro</label>
                <div className="flex items-center justify-between bg-[#e1f5ee] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#1D9E75]" />
                    <span className="text-[11px] font-bold text-[#0f6e56]">Inscripciones Abiertas</span>
                  </div>
                  <button className="text-[10px] font-bold text-[#5B4FE8] hover:underline">CAMBIAR</button>
                </div>
                <p className="text-[10px] text-[#aaa] mt-1">Los usuarios pueden registrarse actualmente.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Tipo de Acceso</label>
                <div className="space-y-1.5">
                  {[
                    { value: "publico", icon: Globe, label: "Público", sub: "Cualquiera puede inscribirse" },
                    { value: "codigo", icon: Lock, label: "Mediante Código", sub: "Requiere código de invitación" },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setTipoAcceso(opt.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition ${tipoAcceso === opt.value ? "border-[#5B4FE8] bg-[#eeedfe]" : "border-[#ede9f8] bg-white hover:bg-[#f5f3fb]"}`}>
                      <opt.icon className={`h-4 w-4 flex-shrink-0 ${tipoAcceso === opt.value ? "text-[#5B4FE8]" : "text-[#aaa]"}`} />
                      <div className="text-left">
                        <p className={`text-[11px] font-bold ${tipoAcceso === opt.value ? "text-[#3c3489]" : "text-[#1a1a2e]"}`}>{opt.label}</p>
                        <p className="text-[10px] text-[#aaa]">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Control */}
          <div className="bg-[#5B4FE8] rounded-xl p-5 text-white">
            <h3 className="text-[12px] font-bold mb-2">Panel de Control</h3>
            <p className="text-[11px] text-white/60 mb-4">Asegúrate de guardar los cambios antes de salir de esta sección de configuración.</p>
            <div className="space-y-2">
              <button onClick={handleSave} disabled={saving}
                className="w-full bg-white text-[#5B4FE8] rounded-lg py-2 text-[12px] font-bold hover:bg-white/90 transition flex items-center justify-center gap-2 disabled:opacity-60">
                {saved ? <><Check className="h-3.5 w-3.5" /> Guardado</> : <><Save className="h-3.5 w-3.5" /> Guardar Cambios</>}
              </button>
              {viaje?.slug && (
                <Link href={`/viajes/${viaje.slug}`} target="_blank"
                  className="w-full border border-white/30 text-white rounded-lg py-2 text-[12px] font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2">
                  <Eye className="h-3.5 w-3.5" /> Vista Previa
                </Link>
              )}
            </div>
          </div>

          {/* Última modificación */}
          <div className="bg-white rounded-xl border border-[#ede9f8] p-4">
            <div className="flex items-center gap-2 mb-2">
              <ChevronRight className="h-3.5 w-3.5 text-[#5B4FE8]" />
              <h3 className="text-[11px] font-bold text-[#1a1a2e]">Última Modificación</h3>
            </div>
            <p className="text-[11px] text-[#aaa]">14 de Febrero, 2024 · 15:42</p>
            <p className="text-[11px] text-[#aaa]">Por: Alejandro Moreno (Admin)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
