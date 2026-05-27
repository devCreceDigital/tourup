"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { DollarSign, CreditCard, AlertCircle, Plus, Trash2, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/ui/primitives/Button";
import { Card } from "@/shared/ui/primitives/Card";
import { requestTotemApi } from "@/shared/api/totem-api-client";

interface Condicion {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: "politica" | "inclusion" | "exclusion" | "pago";
}

interface Precio {
  id: string;
  titulo: string;
  precio: number;
  moneda: string;
  descripcion: string;
  destacado: boolean;
}

const PRECIOS_DEFAULT: Precio[] = [
  {
    id: "1",
    titulo: "Precio por persona en habitación doble",
    precio: 850,
    moneda: "USD",
    descripcion: "Incluye todos los servicios mencionados en el itinerario",
    destacado: true,
  },
  {
    id: "2",
    titulo: "Precio por persona en habitación triple",
    precio: 800,
    moneda: "USD",
    descripcion: "Incluye todos los servicios mencionados en el itinerario",
    destacado: false,
  },
];

const CONDICIONES_DEFAULT: Condicion[] = [
  {
    id: "1",
    titulo: "Política de cancelación",
    descripcion:
      "Cancelaciones hasta 30 días antes del viaje: 100% de devolución. Cancelaciones entre 29 y 15 días: 50% de devolución. Cancelaciones menores a 15 días: no hay devolución.",
    tipo: "politica",
  },
  {
    id: "2",
    titulo: "Incluye",
    descripcion:
      "Transporte turístico, alojamiento en hoteles categoría turista, desayunos, entradas a lugares turísticos mencionados, guía profesional bilingüe.",
    tipo: "inclusion",
  },
  {
    id: "3",
    titulo: "No incluye",
    descripcion: "Almuerzos y cenas no especificadas, propinas, gastos personales, seguro de viaje.",
    tipo: "exclusion",
  },
];

export default function DescripcionesPrecioPage() {
  const { id: viajeId } = useParams<{ id: string }>();
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [condiciones, setCondiciones] = useState<Condicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configBase, setConfigBase] = useState<Record<string, unknown>>({});

  const [nuevoPrecio, setNuevoPrecio] = useState({
    titulo: "",
    precio: 0,
    moneda: "USD",
    descripcion: "",
    destacado: false,
  });

  const [nuevaCondicion, setNuevaCondicion] = useState<{
    titulo: string;
    descripcion: string;
    tipo: Condicion["tipo"];
  }>({ titulo: "", descripcion: "", tipo: "politica" });

  const [mostrarFormPrecio, setMostrarFormPrecio] = useState(false);
  const [mostrarFormCondicion, setMostrarFormCondicion] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await requestTotemApi(`/trips/${viajeId}/`);
      const data = await res.json();
      const cfg = (data.configuracion ?? {}) as Record<string, unknown>;
      setConfigBase(cfg);
      setPrecios(Array.isArray(cfg.precios_detalle) ? (cfg.precios_detalle as Precio[]) : PRECIOS_DEFAULT);
      setCondiciones(Array.isArray(cfg.condiciones) ? (cfg.condiciones as Condicion[]) : CONDICIONES_DEFAULT);
    } catch (e) {
      console.error(e);
      setPrecios(PRECIOS_DEFAULT);
      setCondiciones(CONDICIONES_DEFAULT);
    } finally {
      setLoading(false);
    }
  }, [viajeId]);

  useEffect(() => {
    if (!viajeId) return;
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [viajeId, loadData]);

  const agregarPrecio = () => {
    if (nuevoPrecio.titulo && nuevoPrecio.precio > 0) {
      setPrecios([...precios, { id: Date.now().toString(), ...nuevoPrecio }]);
      setNuevoPrecio({ titulo: "", precio: 0, moneda: "USD", descripcion: "", destacado: false });
      setMostrarFormPrecio(false);
    }
  };

  const agregarCondicion = () => {
    if (nuevaCondicion.titulo && nuevaCondicion.descripcion) {
      setCondiciones([...condiciones, { id: Date.now().toString(), ...nuevaCondicion }]);
      setNuevaCondicion({ titulo: "", descripcion: "", tipo: "politica" });
      setMostrarFormCondicion(false);
    }
  };

  const guardarCambios = async () => {
    setSaving(true);
    try {
      await requestTotemApi(`/trips/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configuracion: { ...configBase, precios_detalle: precios, condiciones },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "politica": return "bg-blue-100 text-blue-800";
      case "inclusion": return "bg-green-100 text-green-800";
      case "exclusion": return "bg-red-100 text-red-800";
      case "pago": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTipoIcono = (tipo: string) => {
    switch (tipo) {
      case "pago": return CreditCard;
      default: return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#888] text-[13px]">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Cargando precios…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Precios y Condiciones</h2>
          <p className="text-gray-600">Configura los precios y condiciones del viaje</p>
        </div>
        <Button
          onClick={guardarCambios}
          disabled={saving}
          className="bg-[#00B4FC] hover:bg-[#0098d6] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? "Guardado" : "Guardar cambios"}
        </Button>
      </div>

      {/* Sección de Precios */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Precios</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMostrarFormPrecio(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar precio
          </Button>
        </div>

        {mostrarFormPrecio && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Título del precio"
                value={nuevoPrecio.titulo}
                onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, titulo: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Precio"
                  value={nuevoPrecio.precio || ""}
                  onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, precio: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                />
                <select
                  value={nuevoPrecio.moneda}
                  onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, moneda: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="PEN">PEN</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <textarea
              placeholder="Descripción"
              value={nuevoPrecio.descripcion}
              onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent mb-4"
              rows={3}
            />
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={nuevoPrecio.destacado}
                  onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, destacado: e.target.checked })}
                  className="rounded border-gray-300 text-[#00B4FC] focus:ring-[#00B4FC]"
                />
                <span className="text-sm text-gray-700">Destacar este precio</span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={agregarPrecio} className="bg-[#00B4FC] hover:bg-[#0098d6]">
                Agregar
              </Button>
              <Button variant="outline" onClick={() => setMostrarFormPrecio(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {precios.map((precio) => (
            <div
              key={precio.id}
              className={`p-4 border rounded-lg ${precio.destacado ? "border-[#00B4FC] bg-blue-50" : "border-gray-200"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{precio.titulo}</h4>
                    {precio.destacado && (
                      <span className="px-2 py-1 text-xs bg-[#00B4FC] text-white rounded-full">Destacado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {precio.moneda} {precio.precio}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{precio.descripcion}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPrecios(precios.filter((p) => p.id !== precio.id))}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sección de Condiciones */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Condiciones y Políticas</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMostrarFormCondicion(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar condición
          </Button>
        </div>

        {mostrarFormCondicion && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Título de la condición"
                value={nuevaCondicion.titulo}
                onChange={(e) => setNuevaCondicion({ ...nuevaCondicion, titulo: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
              />
              <select
                value={nuevaCondicion.tipo}
                onChange={(e) =>
                  setNuevaCondicion({ ...nuevaCondicion, tipo: e.target.value as Condicion["tipo"] })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent"
              >
                <option value="politica">Política</option>
                <option value="inclusion">Inclusión</option>
                <option value="exclusion">Exclusión</option>
                <option value="pago">Pago</option>
              </select>
            </div>
            <textarea
              placeholder="Descripción detallada"
              value={nuevaCondicion.descripcion}
              onChange={(e) => setNuevaCondicion({ ...nuevaCondicion, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00B4FC] focus:border-transparent mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={agregarCondicion} className="bg-[#00B4FC] hover:bg-[#0098d6]">
                Agregar
              </Button>
              <Button variant="outline" onClick={() => setMostrarFormCondicion(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {condiciones.map((condicion) => {
            const Icono = getTipoIcono(condicion.tipo);
            return (
              <div key={condicion.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getTipoColor(condicion.tipo)}`}>
                      <Icono className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{condicion.titulo}</h4>
                      <p className="text-gray-600 text-sm">{condicion.descripcion}</p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${getTipoColor(condicion.tipo)}`}
                      >
                        {condicion.tipo.charAt(0).toUpperCase() + condicion.tipo.slice(1)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCondiciones(condiciones.filter((c) => c.id !== condicion.id))}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
