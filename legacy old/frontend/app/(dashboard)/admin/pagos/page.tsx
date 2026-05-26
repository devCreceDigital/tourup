"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CreditCard, AlertCircle, Search, Filter, Download, Eye, CheckCircle, Clock, Plus, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchDjango } from "@/lib/api";

interface Pago {
  id: string;
  inscripcion: string;
  cuota_numero: number | null;
  cuota_fecha_vencimiento: string | null;
  monto: number;
  metodo: string;
  estado: "pendiente" | "verificado" | "rechazado";
  referencia: string;
  created_at: string;
  viajero_nombre: string;
  viajero_email: string;
  viaje_nombre: string;
}

interface ResumenPagos {
  total: number;
  pendientes: number;
  verificados: number;
  rechazados: number;
}

function PagosPageInner() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("buscar") ?? "");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroViaje, setFiltroViaje] = useState<string>("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [showModalPago, setShowModalPago] = useState(false);
  const [nuevoPago, setNuevoPago] = useState({ inscripcion_id: "", monto: "", metodo: "transferencia", referencia: "", notas: "" });
  const [inscripciones, setInscripciones] = useState<{id: string; viajero_nombre: string; viaje_nombre: string}[]>([]);
  const [creandoPago, setCreandoPago] = useState(false);

  const loadInscripciones = async () => {
    const res = await fetchDjango("/inscripciones/");
    if (res.ok) {
      const data = await res.json();
      setInscripciones(Array.isArray(data) ? data : (data.results ?? []));
    }
  };

  const handleCrearPago = async () => {
    if (!nuevoPago.inscripcion_id || !nuevoPago.monto) return;
    setCreandoPago(true);
    try {
      const res = await fetchDjango(`/inscripciones/${nuevoPago.inscripcion_id}/pagos/manual/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: Number(nuevoPago.monto), metodo: nuevoPago.metodo, referencia: nuevoPago.referencia, notas: nuevoPago.notas }),
      });
      if (res.ok) {
        setShowModalPago(false);
        setNuevoPago({ inscripcion_id: "", monto: "", metodo: "transferencia", referencia: "", notas: "" });
        setPagos([]);
        setLoading(true);
      } else {
        const err = await res.json();
        alert("Error: " + JSON.stringify(err));
      }
    } finally { setCreandoPago(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const qs = new URLSearchParams();
          if (searchTerm.trim()) qs.set("search", searchTerm.trim());
          if (filtroEstado) qs.set("estado", filtroEstado);
          const res = await fetchDjango(`/pagos/?${qs.toString()}`);
          if (!res.ok) {
            setPagos([]);
            return;
          }
          const data = await res.json();
          const results = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [];
          setPagos(results);
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    return () => clearTimeout(t);
  }, [searchTerm, filtroEstado]);

  const pagosFiltrados = useMemo(() => {
    return pagos.filter(pago => {
      const coincideBusqueda = (pago.viajero_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (pago.viajero_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (pago.viaje_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (pago.referencia || "").toLowerCase().includes(searchTerm.toLowerCase());
      const coincideEstado = !filtroEstado || pago.estado === filtroEstado;
      const coincideViaje = !filtroViaje || pago.viaje_nombre === filtroViaje;
      
      return coincideBusqueda && coincideEstado && coincideViaje;
    });
  }, [pagos, searchTerm, filtroEstado, filtroViaje]);

  const resumen: ResumenPagos = useMemo(() => {
    return {
      total: pagos.length,
      verificados: pagos.filter(p => p.estado === "verificado").length,
      pendientes: pagos.filter(p => p.estado === "pendiente").length,
      rechazados: pagos.filter(p => p.estado === "rechazado").length,
    };
  }, [pagos]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente": return "orange";
      case "verificado": return "green";
      case "rechazado": return "red";
      default: return "gray";
    }
  };

  const getEstadoIcono = (estado: string) => {
    switch (estado) {
      case "pendiente": return AlertCircle;
      case "verificado": return CheckCircle;
      case "rechazado": return AlertCircle;
      default: return CreditCard;
    }
  };

  const viajes = [...new Set(pagos.map(p => p.viaje_nombre))];

  const handleExport = () => {
    const rows = [
      ["id", "viajero", "email", "viaje", "monto", "metodo", "estado", "referencia", "cuota_numero", "cuota_vencimiento", "created_at"],
      ...pagosFiltrados.map((p) => [
        p.id,
        p.viajero_nombre,
        p.viajero_email,
        p.viaje_nombre,
        String(p.monto),
        p.metodo,
        p.estado,
        p.referencia,
        p.cuota_numero == null ? "" : String(p.cuota_numero),
        p.cuota_fecha_vencimiento ?? "",
        p.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pagos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
            <p className="text-gray-600">Controla y monitorea los pagos de tus viajeros</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="text-gray-600">Controla y monitorea los pagos de tus viajeros</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <button
            onClick={() => { setShowModalPago(true); void loadInscripciones(); }}
            className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[12px] font-bold hover:bg-[#4a3fd0] transition"
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo Pago
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pagos</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.total}</p>
            </div>
            <CreditCard className="h-8 w-8 text-[#00B4FC]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verificados</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.verificados}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.pendientes}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rechazados</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.rechazados}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pagos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>

          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="verificado">Verificado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Viaje</label>
                <select
                  value={filtroViaje}
                  onChange={(e) => setFiltroViaje(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="">Todos</option>
                  {viajes.map(viaje => (
                    <option key={viaje} value={viaje}>{viaje}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Tabla de pagos */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Viajero</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Viaje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagosFiltrados.map((pago) => {
                const IconoEstado = getEstadoIcono(pago.estado);
                return (
                  <tr key={pago.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pago.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pago.viajero_nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{pago.viaje_nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.monto.toLocaleString("es-PE")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getEstadoColor(pago.estado)}>
                        <IconoEstado className="h-3 w-3 mr-1" />
                        {pago.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.cuota_fecha_vencimiento ? new Date(pago.cuota_fecha_vencimiento).toLocaleDateString("es-PE") : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/pagos/${pago.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {pagosFiltrados.length === 0 && (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron pagos</h3>
            <p className="text-gray-600">
              {searchTerm || filtroEstado || filtroViaje
                ? "No hay pagos que coincidan con los filtros aplicados."
                : "Aún no hay pagos registrados en el sistema."
              }
            </p>
          </div>
        )}
      </Card>
      {showModalPago && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-extrabold text-[#1a1a2e]">Nuevo Pago</h3>
              <button onClick={() => setShowModalPago(false)} className="p-1.5 text-[#aaa] hover:text-[#555] rounded-lg transition"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Inscripcion</label>
                <select value={nuevoPago.inscripcion_id} onChange={e => setNuevoPago(p => ({...p, inscripcion_id: e.target.value}))} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] bg-white">
                  <option value="">Seleccionar inscripcion...</option>
                  {inscripciones.map(i => (
                    <option key={i.id} value={i.id}>{i.viajero_nombre || i.id.slice(0,8)} — {i.viaje_nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Monto (S/.)</label>
                  <input type="number" value={nuevoPago.monto} onChange={e => setNuevoPago(p => ({...p, monto: e.target.value}))} placeholder="0.00" className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Metodo</label>
                  <select value={nuevoPago.metodo} onChange={e => setNuevoPago(p => ({...p, metodo: e.target.value}))} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] bg-white">
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Referencia (opcional)</label>
                <input value={nuevoPago.referencia} onChange={e => setNuevoPago(p => ({...p, referencia: e.target.value}))} placeholder="Ej: TRF-2026-001" className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Notas (opcional)</label>
                <textarea value={nuevoPago.notas} onChange={e => setNuevoPago(p => ({...p, notas: e.target.value}))} rows={2} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] resize-none" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModalPago(false)} className="rounded-lg border border-[#ede9f8] px-4 py-2 text-[11px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">Cancelar</button>
              <button onClick={handleCrearPago} disabled={creandoPago || !nuevoPago.inscripcion_id || !nuevoPago.monto} className="rounded-lg bg-[#5B4FE8] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#4a3fd0] transition disabled:opacity-60 flex items-center gap-1.5">
                {creandoPago && <Loader2 className="h-3 w-3 animate-spin" />}
                {creandoPago ? "Creando..." : "Crear Pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PagosPage() {
  return <Suspense fallback={null}><PagosPageInner /></Suspense>;
}
