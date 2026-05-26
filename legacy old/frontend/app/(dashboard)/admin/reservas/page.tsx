"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { CheckCircle, Clock, Download, Eye, Filter, Plus, Search, TrendingUp, X, Loader2, XCircle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchDjango } from "@/lib/api";

interface Inscripcion {
  id: string;
  viajero: string;
  viajero_nombre: string;
  viajero_email: string;
  viaje: string;
  viaje_nombre: string;
  estado: "pre_inscrito" | "pendiente_pago" | "confirmado" | "cancelado";
  pago_estado: string;
  documentos_estado: string;
  tipo_habitacion: string;
  created_at: string;
}

export default function ReservasPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estado, setEstado] = useState<string>("");
  const [documentos, setDocumentos] = useState<string>("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showModalInsc, setShowModalInsc] = useState(false);
  const [viajesLista, setViajesLista] = useState<{id: string; nombre: string; slug: string}[]>([]);
  const [nuevaInsc, setNuevaInsc] = useState({ viaje_id: "", email: "", nombre: "", habitacion: "multiple" });
  const [creandoInsc, setCreandoInsc] = useState(false);
  const [errorInsc, setErrorInsc] = useState<string | null>(null);

  const loadViajes = useCallback(async () => {
    const res = await fetchDjango("/viajes/?page_size=100");
    if (res.ok) {
      const data = await res.json();
      setViajesLista((data.results ?? []).map((v: any) => ({ id: v.id, nombre: v.nombre, slug: v.slug })));
    }
  }, []);

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la inscripción de ${nombre || "este viajero"}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetchDjango(`/inscripciones/${id}/`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setReloadKey(k => k + 1);
      } else {
        alert("No se pudo eliminar la inscripción.");
      }
    } catch { alert("Error al eliminar."); }
  };

  const handleCrearInscripcion = async () => {
    if (!nuevaInsc.viaje_id || !nuevaInsc.email || !nuevaInsc.nombre) return;
    setCreandoInsc(true);
    setErrorInsc(null);
    try {
      const res = await fetchDjango(`/viajes/${nuevaInsc.viaje_id}/inscripciones/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nuevaInsc.email.trim(),
          nombre_completo: nuevaInsc.nombre.trim(),
          tipo_habitacion: nuevaInsc.habitacion,
        }),
      });
      if (res.ok) {
        setShowModalInsc(false);
        setNuevaInsc({ viaje_id: "", email: "", nombre: "", habitacion: "multiple" });
        setReloadKey(k => k + 1);
      } else {
        const err = await res.json();
        setErrorInsc(err.detail ?? JSON.stringify(err));
      }
    } finally { setCreandoInsc(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const qs = new URLSearchParams();
          if (searchTerm.trim()) qs.set("buscar", searchTerm.trim());
          if (estado) qs.set("estado", estado);
          if (documentos) qs.set("documentos", documentos);
          const res = await fetchDjango(`/inscripciones/?${qs.toString()}`);
          if (!res.ok) {
            setInscripciones([]);
            return;
          }
          const data = await res.json();
          const results = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [];
          setInscripciones(results);
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    return () => clearTimeout(t);
  }, [searchTerm, estado, documentos, reloadKey]);

  const resumen = useMemo(() => {
    return {
      total: inscripciones.length,
      pre: inscripciones.filter((i) => i.estado === "pre_inscrito").length,
      pendiente: inscripciones.filter((i) => i.estado === "pendiente_pago").length,
      confirmadas: inscripciones.filter((i) => i.estado === "confirmado").length,
    };
  }, [inscripciones]);

  const viajes = [...new Set(inscripciones.map((i) => i.viaje_nombre))];

  const handleExport = () => {
    const rows = [
      ["id", "viajero", "email", "viaje", "estado", "pago_estado", "documentos_estado", "tipo_habitacion", "created_at"],
      ...inscripciones.map((i) => [
        i.id,
        i.viajero_nombre,
        i.viajero_email,
        i.viaje_nombre,
        i.estado,
        i.pago_estado,
        i.documentos_estado,
        i.tipo_habitacion,
        i.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('\"', '\"\"')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inscripciones.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEstadoBadge = (value: Inscripcion["estado"]) => {
    const variant = value === "confirmado" ? "green" : value === "pendiente_pago" ? "orange" : value === "pre_inscrito" ? "blue" : "red";
    const label = value === "confirmado" ? "Confirmado" : value === "pendiente_pago" ? "Pendiente pago" : value === "pre_inscrito" ? "Pre inscrito" : "Cancelado";
    const Icon = value === "confirmado" ? CheckCircle : Clock;
    return (
      <Badge variant={variant}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inscripciones</h1>
            <p className="text-gray-600">Administra las inscripciones a tus viajes</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inscripciones</h1>
          <p className="text-gray-600">Administra las inscripciones a tus viajes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Reporte
          </Button>
          <button
            onClick={() => { setShowModalInsc(true); void loadViajes(); }}
            className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[12px] font-bold hover:bg-[#4a3fd0] transition"
          >
            <Plus className="h-3.5 w-3.5" /> Nueva Inscripción
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.total}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-[#00B4FC]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pre inscritos</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.pre}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendiente pago</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.pendiente}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmadas</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.confirmadas}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por viajero o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
              />
            </div>
            <Button variant="outline" onClick={() => setMostrarFiltros(!mostrarFiltros)} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>

          {mostrarFiltros ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="pre_inscrito">Pre inscrito</option>
                  <option value="pendiente_pago">Pendiente pago</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documentos</label>
                <select
                  value={documentos}
                  onChange={(e) => setDocumentos(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="incompleto">Incompleto</option>
                  <option value="faltante">Faltante</option>
                  <option value="completo">Completo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Viajes (vista)</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value="" onChange={() => {}}>
                  <option value="">{viajes.length ? `${viajes.length} viajes en resultados` : "—"}</option>
                </select>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Viajero</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Viaje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documentos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inscripciones.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{i.viajero_nombre}</div>
                    <div className="text-sm text-gray-500">{i.viajero_email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{i.viaje_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(i.estado)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i.pago_estado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i.documentos_estado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {i.created_at ? new Date(i.created_at).toLocaleDateString("es-PE") : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/reservas/${i.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <button onClick={() => handleEliminar(i.id, i.viajero_nombre)} className="p-1.5 text-[#aaa] hover:text-[#a32d2d] hover:bg-[#fcebeb] rounded-lg transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inscripciones.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron inscripciones</h3>
            <p className="text-gray-600">{searchTerm || estado || documentos ? "No hay resultados con los filtros." : "Aún no hay inscripciones registradas."}</p>
          </div>
        ) : null}
      </Card>

      {/* MODAL NUEVA INSCRIPCION */}
      {showModalInsc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-extrabold text-[#1a1a2e]">Nueva Inscripción</h3>
              <button onClick={() => setShowModalInsc(false)} className="p-1.5 text-[#aaa] hover:text-[#555] rounded-lg transition"><X className="h-4 w-4" /></button>
            </div>
            {errorInsc && <p className="text-[11px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorInsc}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Viaje</label>
                <select value={nuevaInsc.viaje_id} onChange={e => setNuevaInsc(p => ({...p, viaje_id: e.target.value}))} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] bg-white">
                  <option value="">Seleccionar viaje...</option>
                  {viajesLista.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Nombre completo</label>
                <input value={nuevaInsc.nombre} onChange={e => setNuevaInsc(p => ({...p, nombre: e.target.value}))} placeholder="Ej: Juan Pérez" className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Email</label>
                <input type="email" value={nuevaInsc.email} onChange={e => setNuevaInsc(p => ({...p, email: e.target.value}))} placeholder="correo@ejemplo.com" className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px] block mb-1">Habitación</label>
                <select value={nuevaInsc.habitacion} onChange={e => setNuevaInsc(p => ({...p, habitacion: e.target.value}))} className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] bg-white">
                  <option value="multiple">Múltiple (incluido)</option>
                  <option value="doble">Doble (+$25)</option>
                  <option value="simple">Simple (+$50)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModalInsc(false)} className="rounded-lg border border-[#ede9f8] px-4 py-2 text-[11px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">Cancelar</button>
              <button onClick={handleCrearInscripcion} disabled={creandoInsc || !nuevaInsc.viaje_id || !nuevaInsc.email || !nuevaInsc.nombre} className="rounded-lg bg-[#5B4FE8] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#4a3fd0] transition disabled:opacity-60 flex items-center gap-1.5">
                {creandoInsc && <Loader2 className="h-3 w-3 animate-spin" />}
                {creandoInsc ? "Creando..." : "Crear Inscripción"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
