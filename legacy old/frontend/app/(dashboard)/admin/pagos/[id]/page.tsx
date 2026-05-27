"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, CreditCard, CheckCircle, XCircle, Clock,
  User, Mail, Calendar, Hash, FileText, Loader2, AlertCircle
} from "lucide-react";
import { fetchDjango } from "@/lib/api";

type EstadoPago = "pendiente" | "verificado" | "rechazado";

interface PagoDetail {
  id: string;
  inscripcion: string;
  cuota: string | null;
  cuota_numero: number | null;
  cuota_fecha_vencimiento: string | null;
  cuota_nombre: string | null;
  monto: number;
  metodo: string;
  estado: EstadoPago;
  referencia: string;
  notas: string;
  created_at: string;
  viajero_nombre: string;
  viajero_email: string;
  viaje_nombre: string;
}

const ESTADO_CONFIG: Record<EstadoPago, { bg: string; text: string; icon: typeof CheckCircle; label: string }> = {
  verificado: { bg: "bg-[#e1f5ee]", text: "text-[#0f6e56]", icon: CheckCircle, label: "Verificado" },
  pendiente:  { bg: "bg-[#faeeda]", text: "text-[#854f0b]", icon: Clock,       label: "Pendiente"  },
  rechazado:  { bg: "bg-[#fcebeb]", text: "text-[#a32d2d]", icon: XCircle,     label: "Rechazado"  },
};

export default function PagoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pago, setPago] = useState<PagoDetail | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [msgExito, setMsgExito] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await fetchDjango(`/pagos/${id}/`);
          if (!res.ok) { setError("No se pudo cargar el pago."); return; }
          setPago(await res.json());
        } finally { setLoading(false); }
      })();
    }, 0);
    return () => clearTimeout(t);
  }, [id]);

  const handleCambiarEstado = async (nuevoEstado: EstadoPago) => {
    if (!pago) return;
    setActualizando(true);
    try {
      const res = await fetchDjango(`/pagos/${id}/estado/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        const data = await res.json();
        setPago(prev => prev ? { ...prev, estado: data.estado } : prev);
        setMsgExito(`Pago marcado como ${ESTADO_CONFIG[nuevoEstado].label}`);
        setTimeout(() => setMsgExito(null), 3000);
      } else {
        const err = await res.json();
        setError(err.detail ?? "Error al actualizar el estado.");
      }
    } finally { setActualizando(false); }
  };

  const formatFecha = (f: string) => {
    if (!f) return "—";
    try { return new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return f; }
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="bg-white rounded-xl border border-[#E0E4EF] px-6 py-4 flex items-center justify-between shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        <div className="flex items-center gap-3">
          <Link href="/admin/pagos" className="p-2 text-[#aaa] hover:text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#5B4FE8]" />
            <span className="text-[16px] font-extrabold text-[#1a1a2e]">Detalle de Pago</span>
          </div>
        </div>
        {pago && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${ESTADO_CONFIG[pago.estado].bg} ${ESTADO_CONFIG[pago.estado].text}`}>
            {(() => { const Icon = ESTADO_CONFIG[pago.estado].icon; return <Icon className="h-3.5 w-3.5" />; })()}
            {ESTADO_CONFIG[pago.estado].label}
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-[#ede9f8] p-10 flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#5B4FE8]" />
          <span className="text-[12px] text-[#aaa]">Cargando pago...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-xl border border-red-200 p-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-[12px] text-red-500">{error}</span>
        </div>
      )}

      {msgExito && (
        <div className="bg-[#e1f5ee] rounded-xl border border-[#1D9E75]/20 p-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-[#1D9E75]" />
          <span className="text-[12px] font-semibold text-[#0f6e56]">{msgExito}</span>
        </div>
      )}

      {!loading && pago && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* INFO PRINCIPAL — 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Viajero y viaje */}
            <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
              <div className="px-5 py-3 border-b border-[#e8e3f5] flex items-center gap-2">
                <User className="h-4 w-4 text-[#5B4FE8]" />
                <span className="text-[13px] font-bold text-[#1a1a2e]">Viajero</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Nombre</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e]">{pago.viajero_nombre || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Email</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1">
                    <Mail className="h-3 w-3 text-[#aaa]" />{pago.viajero_email || "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Viaje</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e]">{pago.viaje_nombre || "—"}</p>
                </div>
              </div>
            </div>

            {/* Detalles del pago */}
            <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
              <div className="px-5 py-3 border-b border-[#e8e3f5] flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#5B4FE8]" />
                <span className="text-[13px] font-bold text-[#1a1a2e]">Detalles del pago</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Monto</p>
                  <p className="text-[18px] font-extrabold text-[#1a1a2e]">
                    S/. {Number(pago.monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Metodo</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e] capitalize">{pago.metodo || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Cuota</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e]">
                    {pago.cuota_numero == null ? "—" : `#${pago.cuota_numero} ${pago.cuota_nombre ?? ""}`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Vencimiento</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#aaa]" />
                    {pago.cuota_fecha_vencimiento ? new Date(pago.cuota_fecha_vencimiento).toLocaleDateString("es-PE") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Referencia</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1">
                    <Hash className="h-3 w-3 text-[#aaa]" />{pago.referencia || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Fecha de pago</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e]">{formatFecha(pago.created_at)}</p>
                </div>
                {pago.notas && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Notas</p>
                    <p className="text-[12px] text-[#555] whitespace-pre-wrap flex items-start gap-1">
                      <FileText className="h-3 w-3 text-[#aaa] mt-0.5 flex-shrink-0" />{pago.notas}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACCIONES — 1/3 */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
              <div className="px-5 py-3 border-b border-[#e8e3f5]">
                <span className="text-[13px] font-bold text-[#1a1a2e]">Acciones</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {pago.estado !== "verificado" && (
                  <button
                    onClick={() => handleCambiarEstado("verificado")}
                    disabled={actualizando}
                    className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] text-white rounded-lg px-4 py-2.5 text-[12px] font-bold hover:bg-[#178a65] transition disabled:opacity-60"
                  >
                    {actualizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Verificar pago
                  </button>
                )}
                {pago.estado !== "rechazado" && (
                  <button
                    onClick={() => handleCambiarEstado("rechazado")}
                    disabled={actualizando}
                    className="w-full flex items-center justify-center gap-2 bg-[#fcebeb] text-[#a32d2d] rounded-lg px-4 py-2.5 text-[12px] font-bold hover:bg-[#f8d7d7] transition disabled:opacity-60"
                  >
                    {actualizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Rechazar pago
                  </button>
                )}
                {pago.estado !== "pendiente" && (
                  <button
                    onClick={() => handleCambiarEstado("pendiente")}
                    disabled={actualizando}
                    className="w-full flex items-center justify-center gap-2 border border-[#ede9f8] text-[#666] rounded-lg px-4 py-2.5 text-[12px] font-semibold hover:bg-[#f5f3fb] transition disabled:opacity-60"
                  >
                    <Clock className="h-4 w-4" /> Marcar como pendiente
                  </button>
                )}
              </div>
            </div>

            {/* ID del pago */}
            <div className="bg-white rounded-xl border border-[#E0E4EF] p-4">
              <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-1">ID del pago</p>
              <p className="text-[10px] font-mono text-[#666] break-all">{pago.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
