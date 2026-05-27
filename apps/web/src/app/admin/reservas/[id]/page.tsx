"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, CreditCard,
  FileText, CheckCircle, Clock, XCircle, Loader2, AlertCircle,
  Home, Heart, ChevronRight
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

interface InscripcionDetail {
  id: string;
  viajero: string;
  viajero_nombre: string;
  viajero_email: string;
  viaje: string;
  viaje_nombre: string;
  estado: string;
  pago_estado: string;
  docs_estado: string;
  tipo_habitacion: string;
  created_at: string;
}

const ESTADO_CONFIG: Record<string, { bg: string; text: string; icon: LucideIcon; label: string }> = {
  pre_inscrito:  { bg: "bg-[#faeeda]", text: "text-[#854f0b]", icon: Clock,        label: "Pre Inscrito"  },
  confirmado:    { bg: "bg-[#e1f5ee]", text: "text-[#0f6e56]", icon: CheckCircle,  label: "Confirmado"    },
  cancelado:     { bg: "bg-[#fcebeb]", text: "text-[#a32d2d]", icon: XCircle,      label: "Cancelado"     },
  en_viaje:      { bg: "bg-[#e8e3f5]", text: "text-[#5B4FE8]", icon: MapPin,       label: "En Viaje"      },
};

const PAGO_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pendiente:  { bg: "bg-[#faeeda]", text: "text-[#854f0b]", label: "Pendiente"  },
  parcial:    { bg: "bg-[#e8e3f5]", text: "text-[#5B4FE8]", label: "Parcial"    },
  pagado:     { bg: "bg-[#e1f5ee]", text: "text-[#0f6e56]", label: "Pagado"     },
  vencido:    { bg: "bg-[#fcebeb]", text: "text-[#a32d2d]", label: "Vencido"    },
};

export default function InscripcionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insc, setInsc] = useState<InscripcionDetail | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [msgExito, setMsgExito] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await requestTotemApi(`/enrollments/${id}/`);
      if (!res.ok) { setError("No se pudo cargar la inscripción."); return; }
      setInsc(await res.json());
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!insc) return;
    setActualizando(true);
    try {
      const res = await requestTotemApi(`/enrollments/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        const data = await res.json();
        setInsc(prev => prev ? { ...prev, estado: data.estado } : prev);
        setMsgExito(`Estado actualizado a ${ESTADO_CONFIG[nuevoEstado]?.label ?? nuevoEstado}`);
        setTimeout(() => setMsgExito(null), 3000);
      } else {
        const err = await res.json();
        setError(err.detail ?? "Error al actualizar.");
      }
    } finally { setActualizando(false); }
  };

  const formatFecha = (f: string) => {
    try { return new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return f; }
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="bg-white rounded-xl border border-[#E0E4EF] px-6 py-4 flex items-center justify-between shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        <div className="flex items-center gap-3">
          <Link href="/admin/reservas" className="p-2 text-[#aaa] hover:text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#5B4FE8]" />
            <span className="text-[16px] font-extrabold text-[#1a1a2e]">Detalle de Inscripción</span>
          </div>
        </div>
        {insc && (() => {
          const cfg = ESTADO_CONFIG[insc.estado] ?? { bg: "bg-[#f5f3fb]", text: "text-[#666]", icon: AlertCircle, label: insc.estado };
          const Icon = cfg.icon;
          return (
            <div className={"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold " + cfg.bg + " " + cfg.text}>
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </div>
          );
        })()}
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-[#ede9f8] p-10 flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#5B4FE8]" />
          <span className="text-[12px] text-[#aaa]">Cargando inscripción...</span>
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

      {!loading && insc && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* INFO PRINCIPAL */}
          <div className="lg:col-span-2 space-y-4">
            {/* Viajero */}
            <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
              <div className="px-5 py-3 border-b border-[#e8e3f5] flex items-center gap-2">
                <User className="h-4 w-4 text-[#5B4FE8]" />
                <span className="text-[13px] font-bold text-[#1a1a2e]">Viajero</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Nombre</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e]">{insc.viajero_nombre || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Email</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1">
                    <Mail className="h-3 w-3 text-[#aaa]" />{insc.viajero_email || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Viaje */}
            <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
              <div className="px-5 py-3 border-b border-[#e8e3f5] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#5B4FE8]" />
                <span className="text-[13px] font-bold text-[#1a1a2e]">Viaje</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Nombre</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e]">{insc.viaje_nombre || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Habitación</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e] capitalize flex items-center gap-1">
                    <Home className="h-3 w-3 text-[#aaa]" />{insc.tipo_habitacion || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Inscrito el</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#aaa]" />{formatFecha(insc.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-0.5">Documentos</p>
                  <p className="text-[13px] font-semibold text-[#1a1a2e] capitalize">{insc.docs_estado || "—"}</p>
                </div>
              </div>
            </div>

            {/* Pagos */}
            <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
              <div className="px-5 py-3 border-b border-[#e8e3f5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#5B4FE8]" />
                  <span className="text-[13px] font-bold text-[#1a1a2e]">Pago</span>
                </div>
                {(() => {
                  const cfg = PAGO_CONFIG[insc.pago_estado] ?? { bg: "bg-[#f5f3fb]", text: "text-[#666]", label: insc.pago_estado || "—" };
                  return (
                    <span className={"inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold " + cfg.bg + " " + cfg.text}>
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
              <div className="px-5 py-4">
                <Link href={"/admin/pagos?buscar=" + encodeURIComponent(insc.viajero_email)}
                  className="text-[12px] text-[#5B4FE8] hover:underline flex items-center gap-1">
                  Ver pagos de este viajero <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* ACCIONES */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
              <div className="px-5 py-3 border-b border-[#e8e3f5]">
                <span className="text-[13px] font-bold text-[#1a1a2e]">Cambiar Estado</span>
              </div>
              <div className="px-5 py-4 space-y-2">
                {["pre_inscrito", "confirmado", "en_viaje", "cancelado"].map(est => {
                  const cfg = ESTADO_CONFIG[est] ?? { bg: "bg-[#f5f3fb]", text: "text-[#666]", icon: AlertCircle, label: est };
                  const Icon = cfg.icon;
                  const isActive = insc.estado === est;
                  return (
                    <button
                      key={est}
                      onClick={() => !isActive && handleCambiarEstado(est)}
                      disabled={actualizando || isActive}
                      className={"w-full flex items-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-bold transition " +
                        (isActive
                          ? cfg.bg + " " + cfg.text + " cursor-default"
                          : "border border-[#ede9f8] text-[#666] hover:bg-[#f5f3fb] disabled:opacity-60")}
                    >
                      <Icon className="h-4 w-4" />
                      {cfg.label}
                      {isActive && <span className="ml-auto text-[10px]">✓ Actual</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Links rápidos */}
            <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
              <div className="px-5 py-3 border-b border-[#e8e3f5]">
                <span className="text-[13px] font-bold text-[#1a1a2e]">Accesos rápidos</span>
              </div>
              <div className="divide-y divide-[#f5f3fb]">
                <Link href={"/admin/viajes/" + insc.viaje + "/inscripciones"}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#faf9fe] transition">
                  <span className="text-[12px] text-[#1a1a2e]">Ver inscritos del viaje</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#aaa]" />
                </Link>
                <Link href={"/admin/pagos?buscar=" + encodeURIComponent(insc.viajero_email)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#faf9fe] transition">
                  <span className="text-[12px] text-[#1a1a2e]">Ver pagos del viajero</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#aaa]" />
                </Link>
              </div>
            </div>

            {/* ID */}
            <div className="bg-white rounded-xl border border-[#E0E4EF] p-4">
              <p className="text-[10px] text-[#aaa] uppercase tracking-[0.4px] mb-1">ID inscripción</p>
              <p className="text-[10px] font-mono text-[#666] break-all">{insc.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
