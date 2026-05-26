"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
  Clock,
  X,
  Copy,
} from "lucide-react";
import { Badge } from "@/shared/ui/primitives/Badge";
import { Card } from "@/shared/ui/primitives/Card";
import { Button } from "@/shared/ui/primitives/Button";
import { requestTotemApi } from "@/shared/api/totem-api-client";

type CuotaAPI = {
  id: string;
  viaje: string;
  nombre: string;
  monto: number;
  fecha_vencimiento: string;
  obligatoria: boolean;
};

type PagoAPI = {
  id: string;
  inscripcion: string;
  cuota: string | null;
  monto: number;
  estado: string;
  pagado_at: string | null;
};

type CuotaConEstado = CuotaAPI & {
  estadoLocal: "pagada" | "pendiente" | "vencida";
};

function formatFecha(fecha: string): string {
  const [year, month, day] = fecha.split("-");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  if (year === undefined || month === undefined || day === undefined) return fecha;
  return `${parseInt(day)} ${meses[parseInt(month) - 1] ?? ""} ${year}`;
}

export default function ViajeroPagosPage() {
  const [cuotas, setCuotas] = useState<CuotaConEstado[]>([]);
  const [totalViaje, setTotalViaje] = useState(0);
  const [totalPagado, setTotalPagado] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalPago, setModalPago] = useState<{ titulo: string; monto: number } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const copiarCuenta = () => {
    navigator.clipboard.writeText("191-12345678-0-12").then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const inscRes = await requestTotemApi("/enrollments?mine=1");
        const inscData = await inscRes.json();
        const inscripciones = inscData.results ?? inscData;
        if (!inscripciones.length) return;

        const inscripcion = inscripciones[0];
        const viajeId = inscripcion.viaje;
        const inscripcionId = inscripcion.id;

        const [cuotasRes, pagosRes] = await Promise.all([
          requestTotemApi(`/payments/installments?tripId=${encodeURIComponent(viajeId)}`),
          requestTotemApi(`/payments?enrollmentId=${encodeURIComponent(inscripcionId)}`),
        ]);

        const cuotasRaw: CuotaAPI[] = await cuotasRes.json();
        const pagosData = await pagosRes.json();
        const pagos: PagoAPI[] = pagosData.results ?? pagosData;

        const today = new Date().toISOString().split("T")[0] ?? "";
        const verificados = pagos.filter((p) => p.estado === "verificado");
        const pagado = verificados.reduce((s, p) => s + Number(p.monto), 0);
        const total = cuotasRaw.reduce((s, c) => s + Number(c.monto), 0);

        const cuotasConEstado: CuotaConEstado[] = cuotasRaw.map((cuota) => {
          const pagada = verificados.some((p) => p.cuota === cuota.id);
          let estadoLocal: "pagada" | "pendiente" | "vencida";
          if (pagada) {
            estadoLocal = "pagada";
          } else if (cuota.fecha_vencimiento < today) {
            estadoLocal = "vencida";
          } else {
            estadoLocal = "pendiente";
          }
          return { ...cuota, estadoLocal };
        });

        setCuotas(cuotasConEstado);
        setTotalViaje(total);
        setTotalPagado(pagado);
      } catch {
        // fall through — empty state shown
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saldoPendiente = totalViaje - totalPagado;
  const vencidas = cuotas.filter((c) => c.estadoLocal === "vencida");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        Cargando pagos…
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#1E1E4E] flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[#5B5BDB]" />
          Mis Pagos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona tus cuotas y revisa tu historial de pagos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#5B5BDB] text-white border-none p-5">
          <div className="text-indigo-200 text-sm font-medium mb-1">Total del Viaje</div>
          <div className="text-3xl font-black">${totalViaje.toFixed(2)}</div>
        </Card>

        <Card className="bg-green-50 border-green-200 p-5">
          <div className="text-green-700 text-sm font-medium mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Pagado hasta ahora
          </div>
          <div className="text-3xl font-black text-green-800">${totalPagado.toFixed(2)}</div>
        </Card>

        <Card className="bg-orange-50 border-orange-200 p-5 relative overflow-hidden">
          <div className="text-orange-700 text-sm font-medium mb-1 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> Saldo Pendiente
          </div>
          <div className="text-3xl font-black text-orange-800">${saldoPendiente.toFixed(2)}</div>
          <div className="absolute right-4 bottom-4">
            <Button
              variant="primary"
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 border-orange-500"
              onClick={() => setModalPago({ titulo: "Saldo total pendiente", monto: saldoPendiente })}
            >
              Pagar Todo
            </Button>
          </div>
        </Card>
      </div>

      {vencidas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-red-800 font-bold text-sm">
              Tienes {vencidas.length} cuota{vencidas.length > 1 ? "s" : ""} vencida
              {vencidas.length > 1 ? "s" : ""}
            </h4>
            <p className="text-red-700 text-xs mt-1">
              {vencidas.map((c) => `"${c.nombre}"`).join(", ")} venció
              {vencidas.length > 1 ? "ron" : ""}. Por favor, regulariza tu pago para evitar
              la cancelación de tu reserva.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            className="shrink-0"
            onClick={() => setModalPago({
              titulo: `Cuota${vencidas.length > 1 ? "s" : ""} vencida${vencidas.length > 1 ? "s" : ""}`,
              monto: vencidas.reduce((s, c) => s + Number(c.monto), 0),
            })}
          >
            Pagar ${vencidas.reduce((s, c) => s + Number(c.monto), 0).toFixed(2)}
          </Button>
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-[#1E1E4E]">Plan de Pagos</h3>
          <Badge variant="blue">Plan en Cuotas</Badge>
        </div>

        <div className="divide-y divide-gray-100">
          {cuotas.map((cuota) => (
            <div
              key={cuota.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {cuota.estadoLocal === "pagada" && (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  )}
                  {cuota.estadoLocal === "vencida" && (
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  )}
                  {cuota.estadoLocal === "pendiente" && (
                    <Clock className="w-6 h-6 text-orange-400" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-[#1E1E4E]">{cuota.nombre}</div>
                  <div className="text-xs text-gray-500">
                    Vencimiento: {formatFecha(cuota.fecha_vencimiento)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-bold text-[#1E1E4E]">${Number(cuota.monto).toFixed(2)}</div>
                  {cuota.estadoLocal === "pagada" && (
                    <span className="text-xs text-green-600 font-medium">Acreditado</span>
                  )}
                  {cuota.estadoLocal === "vencida" && (
                    <span className="text-xs text-red-600 font-medium">Vencido</span>
                  )}
                  {cuota.estadoLocal === "pendiente" && (
                    <span className="text-xs text-orange-600 font-medium">Por Pagar</span>
                  )}
                </div>
                <div className="w-24 flex justify-end">
                  {cuota.estadoLocal === "pagada" ? (
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                      <Download className="w-3 h-3" /> Recibo
                    </Button>
                  ) : (
                    <Button
                      variant={cuota.estadoLocal === "vencida" ? "danger" : "primary"}
                      size="sm"
                      className="h-8 text-xs w-full"
                      onClick={() => setModalPago({ titulo: cuota.nombre, monto: Number(cuota.monto) })}
                    >
                      Pagar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {cuotas.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No hay cuotas registradas para este viaje.
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 text-xs text-gray-500 flex items-center gap-2 rounded-b-lg">
          <Info className="w-4 h-4 shrink-0" />
          Los pagos con tarjeta de crédito pueden tener un recargo adicional de procesamiento de
          hasta 3.5% dependiendo del emisor.
        </div>
      </Card>
    </div>

    {modalPago && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModalPago(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-black text-[#1E1E4E] text-lg">Instrucciones de pago</h3>
              <button
                type="button"
                onClick={() => setModalPago(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#F5F6FB] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{modalPago.titulo}</p>
                  <p className="text-2xl font-black text-[#1E1E4E]">${modalPago.monto.toFixed(2)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-[#5B5BDB] opacity-60" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Datos de transferencia</p>
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-gray-500">Banco</span>
                    <span className="font-semibold text-[#1E1E4E]">BCP</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 items-center">
                    <span className="text-gray-500">Cuenta</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1E1E4E] font-mono">191-12345678-0-12</span>
                      <button
                        type="button"
                        onClick={copiarCuenta}
                        className="text-[#5B5BDB] hover:text-[#4848C0] transition"
                        title="Copiar"
                      >
                        {copiado ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-gray-500">Titular</span>
                    <span className="font-semibold text-[#1E1E4E]">Agencia Totem SAC</span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="text-gray-500">Concepto</span>
                    <span className="font-semibold text-[#1E1E4E]">Viaje escolar 2026</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2 text-xs text-blue-800">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <span>
                  Realiza la transferencia y sube el comprobante en la sección{" "}
                  <strong>Mis Documentos</strong>. El administrador lo validará en 24-48 horas.
                </span>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalPago(null)}
                className="rounded-lg bg-[#5B5BDB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4848C0] transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
