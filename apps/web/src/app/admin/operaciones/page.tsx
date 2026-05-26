"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Briefcase, Calendar, Bus, Home, FileText, CheckCircle, Clock, AlertCircle, Plus, Eye, Filter, X, Trash2 } from "lucide-react";
import { Card } from "@/shared/ui/primitives/Card";
import { Button } from "@/shared/ui/primitives/Button";
import { Badge } from "@/shared/ui/primitives/Badge";
import { requestTotemApi } from "@/shared/api/totem-api-client";

interface Operacion {
  id: string;
  titulo: string;
  viaje_id: string;
  viaje: string;
  tipo: "transporte" | "alojamiento" | "alimentacion" | "actividad" | "documentacion";
  estado: "pendiente" | "en_proceso" | "completado" | "atrasado";
  fecha_inicio: string | null;
  fecha_fin: string | null;
  responsable: string;
  proveedor?: string | null;
  prioridad: "alta" | "media" | "baja";
  notas?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface FiltrosOperaciones {
  tipo: string;
  estado: string;
  prioridad: string;
  responsable: string;
}

interface ViajeOption {
  id: string;
  nombre: string;
}

interface ViajeApiItem {
  id?: unknown;
  nombre?: unknown;
}

export default function OperacionesPage() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viajes, setViajes] = useState<ViajeOption[]>([]);
  const [filtros, setFiltros] = useState<FiltrosOperaciones>({
    tipo: "",
    estado: "",
    prioridad: "",
    responsable: ""
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [crearOpen, setCrearOpen] = useState(false);
  const [selected, setSelected] = useState<Operacion | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    viaje_id: "",
    titulo: "",
    tipo: "transporte" as Operacion["tipo"],
    estado: "pendiente" as Operacion["estado"],
    prioridad: "media" as Operacion["prioridad"],
    responsable: "",
    proveedor: "",
    fecha_inicio: "",
    fecha_fin: "",
    notas: "",
  });

  const loadViajes = useCallback(async () => {
    const res = await requestTotemApi("/trips/?page=1&page_size=100");
    if (!res.ok) return;
    const data = await res.json();
    const results = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : [];
    const mapped: ViajeOption[] = results
      .map((v: ViajeApiItem) => ({ id: String(v.id ?? ""), nombre: String(v.nombre ?? "") }))
      .filter((v: ViajeOption) => v.id && v.nombre);
    setViajes(mapped);
    setForm((prev) => (prev.viaje_id ? prev : mapped[0] ? { ...prev, viaje_id: mapped[0].id } : prev));
  }, []);

  const loadOperaciones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams();
      if (filtros.tipo) qs.set("tipo", filtros.tipo);
      if (filtros.estado) qs.set("estado", filtros.estado);
      if (filtros.prioridad) qs.set("prioridad", filtros.prioridad);
      if (filtros.responsable) qs.set("responsable", filtros.responsable);
      const res = await requestTotemApi(`/trips/operations?${qs.toString()}`);
      if (!res.ok) {
        setOperaciones([]);
        setError("No se pudo cargar operaciones.");
        return;
      }
      const data = await res.json();
      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];
      setOperaciones(results);
    } catch {
      setOperaciones([]);
      setError("No se pudo cargar operaciones.");
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadViajes();
      void loadOperaciones();
    }, 0);
    return () => clearTimeout(t);
  }, [loadViajes, loadOperaciones]);

  const operacionesFiltradas = useMemo(() => {
    return operaciones.filter(op => {
      const coincideTipo = !filtros.tipo || op.tipo === filtros.tipo;
      const coincideEstado = !filtros.estado || op.estado === filtros.estado;
      const coincidePrioridad = !filtros.prioridad || op.prioridad === filtros.prioridad;
      const coincideResponsable = !filtros.responsable || op.responsable.toLowerCase().includes(filtros.responsable.toLowerCase());
      return coincideTipo && coincideEstado && coincidePrioridad && coincideResponsable;
    });
  }, [operaciones, filtros]);

  const getTipoIcono = (tipo: string) => {
    switch (tipo) {
      case "transporte": return Bus;
      case "alojamiento": return Home;
      case "alimentacion": return FileText;
      case "actividad": return Calendar;
      case "documentacion": return FileText;
      default: return Briefcase;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "completado": return "green";
      case "en_proceso": return "blue";
      case "pendiente": return "orange";
      case "atrasado": return "red";
      default: return "gray";
    }
  };

  const getEstadoIcono = (estado: string) => {
    switch (estado) {
      case "completado": return CheckCircle;
      case "en_proceso": return Clock;
      case "pendiente": return AlertCircle;
      case "atrasado": return AlertCircle;
      default: return Briefcase;
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta": return "bg-red-100 text-red-800";
      case "media": return "bg-yellow-100 text-yellow-800";
      case "baja": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const responsables = [...new Set(operaciones.map(op => op.responsable))];

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-PE");
  };

  const handleExport = () => {
    const rows = [
      ["id", "viaje", "titulo", "tipo", "estado", "prioridad", "responsable", "proveedor", "fecha_inicio", "fecha_fin", "notas"],
      ...operacionesFiltradas.map((o) => [
        o.id,
        o.viaje,
        o.titulo,
        o.tipo,
        o.estado,
        o.prioridad,
        o.responsable,
        o.proveedor ?? "",
        o.fecha_inicio ?? "",
        o.fecha_fin ?? "",
        o.notas ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "operaciones.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setForm((prev) => ({
      viaje_id: prev.viaje_id,
      titulo: "",
      tipo: "transporte",
      estado: "pendiente",
      prioridad: "media",
      responsable: "",
      proveedor: "",
      fecha_inicio: "",
      fecha_fin: "",
      notas: "",
    }));
  };

  const handleCreate = async () => {
    if (!form.viaje_id) return;
    try {
      setSaving(true);
      const payload = {
        titulo: form.titulo,
        tipo: form.tipo,
        estado: form.estado,
        prioridad: form.prioridad,
        responsable: form.responsable,
        proveedor: form.proveedor || null,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        notas: form.notas || null,
      };
      const res = await requestTotemApi(`/trips/${form.viaje_id}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        return;
      }
      resetForm();
      setCrearOpen(false);
      await loadOperaciones();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (op: Operacion, patch: Partial<Operacion>) => {
    try {
      setSaving(true);
      const res = await requestTotemApi(`/trips/${op.viaje_id}/operations/${op.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setOperaciones((prev) => prev.map((it) => (it.id === op.id ? updated : it)));
      setSelected((prev) => (prev && prev.id === op.id ? updated : prev));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (op: Operacion) => {
    const ok = window.confirm(`Eliminar operación "${op.titulo}"?`);
    if (!ok) return;
    try {
      setSaving(true);
      const res = await requestTotemApi(`/trips/${op.viaje_id}/operations/${op.id}`, { method: "DELETE" });
      if (!res.ok) return;
      setOperaciones((prev) => prev.filter((it) => it.id !== op.id));
      setSelected((prev) => (prev && prev.id === op.id ? null : prev));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Operaciones</h1>
            <p className="text-gray-600">Controla la logística operativa de tus viajes</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Operaciones</h1>
          <p className="text-gray-600">Controla la logística operativa de tus viajes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-[#00B4FC] hover:bg-[#0098d6]" onClick={() => setCrearOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Operación
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="p-4">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      ) : null}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Operaciones</p>
              <p className="text-2xl font-bold text-gray-900">{operaciones.length}</p>
            </div>
            <Briefcase className="h-8 w-8 text-[#00B4FC]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {operaciones.filter(op => op.estado === "completado").length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900">
                {operaciones.filter(op => op.estado === "en_proceso").length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Atrasadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {operaciones.filter(op => op.estado === "atrasado").length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="transporte">Transporte</option>
                  <option value="alojamiento">Alojamiento</option>
                  <option value="alimentacion">Alimentación</option>
                  <option value="actividad">Actividad</option>
                  <option value="documentacion">Documentación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  value={filtros.prioridad}
                  onChange={(e) => setFiltros({...filtros, prioridad: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="">Todas</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <select
                  value={filtros.responsable}
                  onChange={(e) => setFiltros({...filtros, responsable: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="">Todos</option>
                  {responsables.map(responsable => (
                    <option key={responsable} value={responsable}>{responsable}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de operaciones */}
      <div className="space-y-4">
        {operacionesFiltradas.map((operacion) => {
          const IconoTipo = getTipoIcono(operacion.tipo);
          const IconoEstado = getEstadoIcono(operacion.estado);
          
          return (
            <Card key={operacion.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg bg-gray-100`}>
                    <IconoTipo className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{operacion.titulo}</h3>
                      <Badge variant={getEstadoColor(operacion.estado)}>
                        <IconoEstado className="h-3 w-3 mr-1" />
                        {operacion.estado.replace("_", " ")}
                      </Badge>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPrioridadColor(operacion.prioridad)}`}>
                        {operacion.prioridad}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium text-gray-900">Viaje:</p>
                        <p>{operacion.viaje}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Responsable:</p>
                        <p>{operacion.responsable}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Fechas:</p>
                        <p>{formatDate(operacion.fecha_inicio)} - {formatDate(operacion.fecha_fin)}</p>
                      </div>
                      {operacion.proveedor && (
                        <div>
                          <p className="font-medium text-gray-900">Proveedor:</p>
                          <p>{operacion.proveedor}</p>
                        </div>
                      )}
                    </div>
                    {operacion.notas && (
                      <div className="mt-3">
                        <p className="font-medium text-gray-900 mb-1">Notas:</p>
                        <p className="text-sm text-gray-600">{operacion.notas}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelected(operacion)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {operacionesFiltradas.length === 0 && (
        <div className="text-center py-8">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron operaciones</h3>
          <p className="text-gray-600">
            {Object.values(filtros).some(f => f) 
              ? "No hay operaciones que coincidan con los filtros aplicados."
              : "Aún no hay operaciones registradas en el sistema."
            }
          </p>
        </div>
      )}

      {crearOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">Nueva operación</p>
                <p className="text-sm text-gray-600">Crea una tarea operativa asociada a un viaje</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCrearOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Viaje</label>
                <select
                  value={form.viaje_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, viaje_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  {viajes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                  placeholder="Ej: Reservar buses, confirmar hotel, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value as Operacion["tipo"] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="transporte">Transporte</option>
                  <option value="alojamiento">Alojamiento</option>
                  <option value="alimentacion">Alimentación</option>
                  <option value="actividad">Actividad</option>
                  <option value="documentacion">Documentación</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value as Operacion["estado"] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="completado">Completado</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  value={form.prioridad}
                  onChange={(e) => setForm((prev) => ({ ...prev, prioridad: e.target.value as Operacion["prioridad"] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <input
                  value={form.responsable}
                  onChange={(e) => setForm((prev) => ({ ...prev, responsable: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                  placeholder="Ej: Carlos Mendoza"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (opcional)</label>
                <input
                  value={form.proveedor}
                  onChange={(e) => setForm((prev) => ({ ...prev, proveedor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent min-h-[90px]"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setCrearOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button
                className="bg-[#00B4FC] hover:bg-[#0098d6]"
                onClick={() => void handleCreate()}
                disabled={saving || !form.viaje_id || !form.titulo.trim() || !form.responsable.trim()}
              >
                Crear
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">{selected.titulo}</p>
                <p className="text-sm text-gray-600">{selected.viaje}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Estado</p>
                <select
                  value={selected.estado}
                  onChange={(e) => void handleUpdate(selected, { estado: e.target.value as Operacion["estado"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                  disabled={saving}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="completado">Completado</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>

              <div>
                <p className="text-gray-600 mb-1">Prioridad</p>
                <select
                  value={selected.prioridad}
                  onChange={(e) => void handleUpdate(selected, { prioridad: e.target.value as Operacion["prioridad"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                  disabled={saving}
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <div>
                <p className="text-gray-600">Responsable</p>
                <p className="font-medium text-gray-900">{selected.responsable}</p>
              </div>

              <div>
                <p className="text-gray-600">Proveedor</p>
                <p className="font-medium text-gray-900">{selected.proveedor || "—"}</p>
              </div>

              <div>
                <p className="text-gray-600">Fecha inicio</p>
                <p className="font-medium text-gray-900">{formatDate(selected.fecha_inicio)}</p>
              </div>

              <div>
                <p className="text-gray-600">Fecha fin</p>
                <p className="font-medium text-gray-900">{formatDate(selected.fecha_fin)}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-gray-600">Notas</p>
                <p className="font-medium text-gray-900 whitespace-pre-wrap">{selected.notas || "—"}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => void handleDelete(selected)}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)} disabled={saving}>
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
