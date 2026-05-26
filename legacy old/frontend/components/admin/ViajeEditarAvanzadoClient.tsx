"use client";

import { useState } from "react";
import { User, Users, GraduationCap, Save, Check, History, Download, Info, HelpCircle } from "lucide-react";
import Link from "next/link";
import { fetchDjango } from "@/lib/api";
import { X, Send, CheckCircle } from "lucide-react";
import type { ViajeResumen } from "@/lib/server/viaje";

interface Props {
  viajeId: string;
  nombre: string;
  viaje: ViajeResumen | null;
}

export default function ViajeEditarAvanzadoClient({ viajeId, nombre, viaje }: Props) {
  const cfg = viaje?.configuracion ?? {};

  const [form, setForm] = useState({
    responsable: (cfg.responsable as string) ?? "",
    cuposMax: viaje?.cupos != null ? String(viaje.cupos) : "",
    cuposMin: (cfg.cupos_min as string) ?? "",
    nombreGrupo: (cfg.nombre_grupo as string) ?? "",
    codigoAcceso: (cfg.codigo_acceso as string) ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSoporte, setShowSoporte] = useState(false);
  const [soporteForm, setSoporteForm] = useState({ asunto: "", descripcion: "", prioridad: "normal" });
  const [enviandoSoporte, setEnviandoSoporte] = useState(false);
  const [ticketEnviado, setTicketEnviado] = useState<string | null>(null);

  const handleEnviarSoporte = async () => {
    if (!soporteForm.asunto.trim() || !soporteForm.descripcion.trim()) return;
    setEnviandoSoporte(true);
    try {
      const res = await fetchDjango("/soporte/tickets/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asunto: soporteForm.asunto,
          descripcion: soporteForm.descripcion,
          prioridad: soporteForm.prioridad,
          viaje_id: viajeId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTicketEnviado(data.numero);
        setSoporteForm({ asunto: "", descripcion: "", prioridad: "normal" });
      } else {
        alert("Error al enviar el ticket. Intenta nuevamente.");
      }
    } catch {
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setEnviandoSoporte(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchDjango(`/viajes/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cupos: form.cuposMax ? Number(form.cuposMax) : null,
          configuracion: {
            ...cfg,
            responsable: form.responsable || null,
            cupos_min: form.cuposMin ? Number(form.cuposMin) : null,
            nombre_grupo: form.nombreGrupo || null,
            codigo_acceso: form.codigoAcceso || null,
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const camposCompletados = [form.responsable, form.cuposMax, form.nombreGrupo].filter(Boolean).length;
  const porcentaje = Math.round((camposCompletados / 3) * 100);

  return (
    <div className="p-5 bg-[#f0edf8]">
      {/* BREADCRUMB */}
      <div className="text-[11px] text-[#aaa] mb-4 flex items-center gap-1.5 flex-wrap">
        <Link href="/admin/viajes" className="text-[#5B4FE8] font-semibold hover:underline">Viajes</Link>
        <span className="text-[#ccc]">›</span>
        <Link href={`/admin/viajes/${viajeId}`} className="text-[#5B4FE8] font-semibold hover:underline">{nombre}</Link>
        <span className="text-[#ccc]">›</span>
        <span className="text-[#1a1a2e] font-semibold">Configuración Avanzada</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* FORMULARIOS — 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* GESTIÓN Y AFORO */}
          <div className="bg-white rounded-xl border border-[#ede9f8] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f5f3fb] flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#eeedfe] flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-[#5B4FE8]" />
              </div>
              <span className="text-[13px] font-bold text-[#1a1a2e]">Gestión y Aforo</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Responsable del Viaje (Profesor/Guía)</label>
                <select value={form.responsable} onChange={set("responsable")}
                  className="w-full rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white cursor-pointer">
                  <option value="">Sin responsable asignado</option>
                  <option value="Dr. Roberto Sanchez - Antropología">Dr. Roberto Sanchez - Antropología</option>
                  <option value="Sandra Quevedo Sanchez">Sandra Quevedo Sanchez</option>
                  <option value="Carlos Sanchez">Carlos Sanchez</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Itinerario Base Vinculado</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={viaje?.nombre ?? "Sin itinerario"} className="flex-1 rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] text-[#aaa] outline-none" />
                  <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#ede9f8] bg-white text-[#5B4FE8] hover:bg-[#f0edf8] transition text-[11px] font-bold">CB</button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Capacidad Máxima</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.cuposMax} onChange={set("cuposMax")} placeholder="Sin límite"
                    className="w-24 rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white" />
                  <span className="text-[11px] text-[#aaa]">plz.</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Umbral Mínimo (Quórum)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.cuposMin} onChange={set("cuposMin")} placeholder="—"
                    className="w-24 rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white" />
                  <span className="text-[11px] text-[#aaa]">plz.</span>
                </div>
              </div>
            </div>
          </div>

          {/* CONFIGURACIÓN DE COLECTIVO */}
          <div className="bg-white rounded-xl border border-[#ede9f8] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f5f3fb] flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#e1f5ee] flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 text-[#1D9E75]" />
              </div>
              <span className="text-[13px] font-bold text-[#1a1a2e]">Configuración de Colectivo</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Nombre del Grupo / Colectivo</label>
                <input value={form.nombreGrupo} onChange={set("nombreGrupo")} placeholder="Generación 2024 - Humanidades"
                  className="w-full rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1.5">Código de Acceso Privado</label>
                <div className="flex items-center gap-2">
                  <input value={form.codigoAcceso} onChange={set("codigoAcceso")} placeholder="MAYA-2024-XRT"
                    className="flex-1 rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none transition focus:border-[#5B4FE8] focus:bg-white font-mono" />
                  <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#ede9f8] bg-white text-[#aaa] hover:bg-[#f0edf8] transition">
                    <Users className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="bg-[#f0edf8] rounded-lg p-3 flex items-start gap-2">
                  <Info className="h-4 w-4 text-[#5B4FE8] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#666] leading-relaxed">La configuración de colectivo permite la gestión masiva de facturación y comunicaciones para todos los integrantes asignados.</p>
                </div>
              </div>
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
          {/* Estado del Panel */}
          <div className="bg-white rounded-xl border border-[#ede9f8] p-5">
            <h3 className="text-[12px] font-bold text-[#1a1a2e] mb-3">Estado del Panel</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#aaa]">Campos completados</span>
              <span className="text-[12px] font-extrabold text-[#5B4FE8]">{porcentaje}%</span>
            </div>
            <div className="h-2 bg-[#f0edf8] rounded-full overflow-hidden mb-4">
              <div className="h-full bg-[#5B4FE8] rounded-full transition-all" style={{width:`${porcentaje}%`}} />
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 text-[11px] font-semibold text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg px-3 py-2 transition">
                <History className="h-3.5 w-3.5" /> Ver Historial de Cambios
              </button>
              <button className="w-full flex items-center gap-2 text-[11px] font-semibold text-[#aaa] hover:bg-[#f5f3fb] rounded-lg px-3 py-2 transition">
                <Download className="h-3.5 w-3.5" /> Descartar Cambios
              </button>
            </div>
          </div>

          {/* Guía Rápida */}
          <div className="bg-white rounded-xl border border-[#ede9f8] p-5">
            <h3 className="text-[12px] font-bold text-[#1a1a2e] mb-3">Guía Rápida</h3>
            <div className="space-y-3">
              {[
                { color: "bg-[#5B4FE8]", text: "El Umbral Mínimo determina la fecha de confirmación automática." },
                { color: "bg-[#1D9E75]", text: "Asignar un Responsable activa las notificaciones de emergencia para ese perfil." },
                { color: "bg-[#BA7517]", text: "El Código de Acceso es sensible a mayúsculas y minúsculas." },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${tip.color} flex-shrink-0 mt-1.5`} />
                  <p className="text-[11px] text-[#666] leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ¿Necesitas Ayuda? */}
          <div className="bg-[#1a1a2e] rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-4 w-4 text-[#5B4FE8]" />
              <h3 className="text-[12px] font-bold">¿Necesitas Ayuda?</h3>
            </div>
            <p className="text-[11px] text-white/60 mb-3">Contacta con soporte técnico 24/7. Tiempo de respuesta: 2-4 horas.</p>
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-[10px] text-white/50">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
                Soporte disponible: Lun–Vie 9am–6pm
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/50">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B4FE8]" />
                Urgencias: 24/7
              </div>
            </div>
            <button
              onClick={() => { setShowSoporte(true); setTicketEnviado(null); }}
              className="w-full bg-[#5B4FE8] text-white text-[11px] font-bold py-2 rounded-lg hover:bg-[#4a3fd0] transition flex items-center justify-center gap-2"
            >
              <Send className="h-3.5 w-3.5" /> Abrir Ticket de Soporte
            </button>
          </div>

          {/* MODAL SOPORTE */}
          {showSoporte && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#5B4FE8]" />
                    <h3 className="text-[14px] font-extrabold text-[#1a1a2e]">Ticket de Soporte</h3>
                  </div>
                  <button onClick={() => setShowSoporte(false)} className="p-1.5 text-[#aaa] hover:text-[#555] rounded-lg transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {ticketEnviado ? (
                  <div className="text-center py-6 space-y-3">
                    <CheckCircle className="h-12 w-12 text-[#1D9E75] mx-auto" />
                    <p className="text-[14px] font-bold text-[#1a1a2e]">¡Ticket enviado!</p>
                    <p className="text-[12px] text-[#aaa]">Tu número de ticket es:</p>
                    <div className="bg-[#f5f3fb] rounded-lg px-4 py-2 inline-block">
                      <span className="text-[16px] font-extrabold text-[#5B4FE8] font-mono">{ticketEnviado}</span>
                    </div>
                    <p className="text-[11px] text-[#aaa]">Recibirás respuesta en 2-4 horas hábiles.</p>
                    <button onClick={() => setShowSoporte(false)} className="mt-2 rounded-lg bg-[#5B4FE8] px-6 py-2 text-[12px] font-bold text-white hover:bg-[#4a3fd0] transition">
                      Cerrar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Prioridad</label>
                      <div className="flex gap-2">
                        {[{v:"baja",l:"Baja",c:"bg-[#e1f5ee] text-[#0f6e56]"},{v:"normal",l:"Normal",c:"bg-[#eeedfe] text-[#5B4FE8]"},{v:"urgente",l:"Urgente",c:"bg-[#fcebeb] text-[#a32d2d]"}].map(p => (
                          <button key={p.v} onClick={() => setSoporteForm(f => ({...f, prioridad: p.v}))}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${soporteForm.prioridad === p.v ? p.c : "border border-[#ede9f8] text-[#aaa]"}`}>
                            {p.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Asunto *</label>
                      <input
                        value={soporteForm.asunto}
                        onChange={e => setSoporteForm(f => ({...f, asunto: e.target.value}))}
                        placeholder="Ej: Error al publicar el viaje"
                        className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Descripción *</label>
                      <textarea
                        value={soporteForm.descripcion}
                        onChange={e => setSoporteForm(f => ({...f, descripcion: e.target.value}))}
                        rows={4}
                        placeholder="Describe el problema con el mayor detalle posible..."
                        className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] resize-none transition"
                      />
                    </div>
                    <div className="bg-[#f5f3fb] rounded-lg px-3 py-2">
                      <p className="text-[10px] text-[#aaa]">Viaje ID: <span className="font-mono text-[#5B4FE8]">{viajeId}</span></p>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button onClick={() => setShowSoporte(false)} className="rounded-lg border border-[#ede9f8] px-4 py-2 text-[11px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">
                        Cancelar
                      </button>
                      <button
                        onClick={handleEnviarSoporte}
                        disabled={enviandoSoporte || !soporteForm.asunto.trim() || !soporteForm.descripcion.trim()}
                        className="rounded-lg bg-[#5B4FE8] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#4a3fd0] transition disabled:opacity-60 flex items-center gap-1.5"
                      >
                        <Send className="h-3 w-3" />
                        {enviandoSoporte ? "Enviando..." : "Enviar Ticket"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
