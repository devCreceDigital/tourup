"use client";
import Link from "next/link";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  CreditCard, Plus, Trash2, TrendingUp, AlertTriangle,
  Calendar, Bell, FileText, Download, ChevronRight, Loader2
, ArrowLeft} from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

type Cuota = {
  id: string;
  viaje: string;
  nombre: string;
  monto: number;
  fecha_vencimiento: string;
  obligatoria: boolean;
};

const FORM_EMPTY = { nombre: "", monto: 0, fecha_vencimiento: "", obligatoria: true };

export default function ViajeTarifasPage() {
  const params = useParams<{ id: string }>();
  const viajeId = params?.id ?? "";

  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nuevo, setNuevo] = useState(FORM_EMPTY);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [pasarela, setPasarela] = useState({ stripe: true, bizum: false, transferencia: true });

  const loadCuotas = useCallback(async () => {
    if (!viajeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await requestTotemApi(`/payments/installments?tripId=${encodeURIComponent(viajeId)}`);
      if (res.ok) {
        const data = await res.json();
        const lista = Array.isArray(data) ? data : (data.results ?? []);
        setCuotas(lista);
      } else {
        setError("No se pudieron cargar las cuotas.");
      }
    } catch {
      setError("Error de conexion al cargar cuotas.");
    } finally {
      setLoading(false);
    }
  }, [viajeId]);

  useEffect(() => { loadCuotas(); }, [loadCuotas]);

  const handleCrear = async () => {
    if (!nuevo.nombre.trim() || !nuevo.monto || !nuevo.fecha_vencimiento) return;
    setGuardando(true);
    try {
      const res = await requestTotemApi(`/payments/installments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevo.nombre.trim(),
          monto: nuevo.monto,
          fecha_vencimiento: nuevo.fecha_vencimiento,
          obligatoria: nuevo.obligatoria,
          tripId: viajeId,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setNuevo(FORM_EMPTY);
        await loadCuotas();
      } else {
        const err = await res.json();
        alert("Error: " + JSON.stringify(err));
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("Eliminar esta cuota?")) return;
    setEliminando(id);
    try {
      const res = await requestTotemApi(`/payments/installments/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setCuotas(p => p.filter(c => c.id !== id));
      } else {
        alert("No se pudo eliminar la cuota.");
      }
    } finally {
      setEliminando(null);
    }
  };

  const totalCuotas = cuotas.reduce((acc, c) => acc + Number(c.monto), 0);

  const formatFecha = (f: string) => {
    if (!f) return "—";
    try { return new Date(f + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return f; }
  };

  const id = params?.id ?? "";
  return (
    <div className="space-y-0">
      <div className="bg-white border-b border-[#E0E4EF] px-4 py-2 flex items-center gap-2">
        <Link href={`/admin/viajes/${id}`} className="p-1.5 text-[#aaa] hover:text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-[11px] text-[#aaa]">Volver al viaje</span>
      </div>
      <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
      <div className="px-6 py-4 border-b border-[#E8E3F5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#5B4FE8]" />
          <span className="text-[16px] font-extrabold text-[#1a1a2e] tracking-tight">Configuracion de Pagos</span>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[12px] font-bold hover:bg-[#4a3fd0] transition">
          <Plus className="h-3.5 w-3.5" /> Nueva Cuota
        </button>
      </div>

      <div className="bg-[#f0edf8] p-5">
        <p className="text-[11px] text-[#aaa] mb-4">Define los plazos y grupos de facturacion para este viaje.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">

            {showForm && (
              <div className="bg-white rounded-xl border border-[#5B4FE8]/30 p-4 space-y-3">
                <h3 className="text-[12px] font-bold text-[#1a1a2e]">Nueva Cuota</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del plazo" className="col-span-2 rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
                  <input type="number" value={nuevo.monto || ""} onChange={e => setNuevo(p => ({ ...p, monto: Number(e.target.value) }))} placeholder="Monto (S/.)" className="rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
                  <input type="date" value={nuevo.fecha_vencimiento} onChange={e => setNuevo(p => ({ ...p, fecha_vencimiento: e.target.value }))} className="rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
                  <label className="col-span-2 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={nuevo.obligatoria} onChange={e => setNuevo(p => ({ ...p, obligatoria: e.target.checked }))} className="accent-[#5B4FE8]" />
                    <span className="text-[12px] text-[#555]">Cuota obligatoria</span>
                  </label>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowForm(false); setNuevo(FORM_EMPTY); }} className="rounded-lg border border-[#ede9f8] px-4 py-2 text-[11px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">Cancelar</button>
                  <button onClick={handleCrear} disabled={guardando} className="rounded-lg bg-[#5B4FE8] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#4a3fd0] transition disabled:opacity-60 flex items-center gap-1.5">
                    {guardando && <Loader2 className="h-3 w-3 animate-spin" />}
                    {guardando ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl border border-[#ede9f8] p-8 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#5B4FE8]" />
                <span className="text-[12px] text-[#aaa]">Cargando cuotas...</span>
              </div>
            )}

            {error && !loading && (
              <div className="bg-white rounded-xl border border-red-200 p-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-[12px] text-red-500">{error}</span>
                <button onClick={loadCuotas} className="ml-auto text-[11px] text-[#5B4FE8] font-semibold hover:underline">Reintentar</button>
              </div>
            )}

            {!loading && !error && cuotas.length === 0 && (
              <div className="bg-white rounded-xl border border-[#ede9f8] p-8 text-center">
                <CreditCard className="h-8 w-8 text-[#ddd] mx-auto mb-2" />
                <p className="text-[12px] text-[#aaa]">No hay cuotas configuradas.</p>
                <p className="text-[11px] text-[#ccc]">Haz clic en Nueva Cuota para agregar la primera.</p>
              </div>
            )}

            {!loading && cuotas.map((cuota) => (
              <div key={cuota.id} className="bg-white rounded-xl border border-[#ede9f8] overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-[#eeedfe] flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-4 w-4 text-[#5B4FE8]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#1a1a2e]">{cuota.nombre}</p>
                        <p className="text-[10px] text-[#aaa] flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> Vencimiento {formatFecha(cuota.fecha_vencimiento)}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {cuota.obligatoria
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eeedfe] text-[#3c3489]">Obligatoria</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1efe8] text-[#5f5e5a]">Opcional</span>
                      }
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Monto</p>
                      <p className="text-[13px] font-bold text-[#1a1a2e]">S/. {Number(cuota.monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Vencimiento</p>
                      <p className="text-[13px] font-bold text-[#1a1a2e]">{formatFecha(cuota.fecha_vencimiento)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button onClick={() => handleEliminar(cuota.id)} disabled={eliminando === cuota.id} className="p-1.5 text-[#aaa] hover:text-[#a32d2d] hover:bg-[#fcebeb] rounded-lg transition disabled:opacity-40">
                      {eliminando === cuota.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-[#5B4FE8] rounded-xl p-5 text-white">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.5px] mb-3">Resumen Financiero</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-white/60">Cuotas configuradas</span>
                  <span className="text-[14px] font-extrabold">{cuotas.length}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-white/60">Total por viajero</span>
                  <span className="text-[13px] font-bold text-[#9FE1CB]">S/. {totalCuotas.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-white/60">Cuotas obligatorias</span>
                  <span className="text-[13px] font-bold text-white/80">{cuotas.filter(c => c.obligatoria).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-white/60">Cuotas opcionales</span>
                  <span className="text-[13px] font-bold text-[#FAC775]">{cuotas.filter(c => !c.obligatoria).length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-white/40" />
                <span className="text-[11px] text-white/50">Datos en tiempo real</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#ede9f8] p-4">
              <h3 className="text-[12px] font-bold text-[#1a1a2e] mb-3">Acciones Rapidas</h3>
              <div className="space-y-1">
                {[
                  { icon: Bell, label: "Recordatorio a deudores", color: "text-[#5B4FE8]", bg: "bg-[#eeedfe]", onClick: () => alert("Próximamente: Recordatorio a deudores") },
                  { icon: FileText, label: "Generar facturas masivas", color: "text-[#BA7517]", bg: "bg-[#faeeda]", onClick: () => alert("Próximamente: Generar facturas masivas") },
                  { icon: Download, label: "Descargar Excel de cobros", color: "text-[#1D9E75]", bg: "bg-[#e1f5ee]", onClick: () => alert("Próximamente: Descargar Excel de cobros") },
                ].map((action, i) => (
                  <button key={i} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f3fb] transition group">
                    <div className={`h-7 w-7 rounded-lg ${action.bg} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className={`h-3.5 w-3.5 ${action.color}`} />
                    </div>
                    <span className="text-[12px] font-semibold text-[#1a1a2e] flex-1 text-left">{action.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#ccc] group-hover:text-[#5B4FE8] transition" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#ede9f8] p-4">
              <h3 className="text-[12px] font-bold text-[#1a1a2e] mb-3">Configuracion de Pasarela</h3>
              <div className="space-y-3">
                {[
                  { key: "stripe", label: "Pago con Tarjeta (Stripe)", sub: "Comision: 1.4% + 0.25", enabled: pasarela.stripe },
                  { key: "bizum", label: "Bizum Empresas", sub: "No disponible en esta cuenta", enabled: pasarela.bizum },
                  { key: "transferencia", label: "Transferencia Bancaria", sub: "Validacion manual necesaria", enabled: pasarela.transferencia },
                ].map(p => (
                  <div key={p.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-[#1a1a2e]">{p.label}</p>
                      <p className="text-[10px] text-[#aaa]">{p.sub}</p>
                    </div>
                    <button onClick={() => setPasarela(prev => ({ ...prev, [p.key]: !prev[p.key as keyof typeof prev] }))} className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${p.enabled ? "bg-[#5B4FE8]" : "bg-[#ddd]"}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${p.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
