"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import FiltrosInscritos from "@/contexts/enrollments/ui/admin/FiltrosInscritos";
import TablaInscritos from "@/contexts/enrollments/ui/admin/TablaInscritos";
import DrawerDetalleInscripcion from "@/contexts/enrollments/ui/admin/DrawerDetalleInscripcion";
import { type InscripcionAPI } from "@/shared/domain/enrollment-types";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { Download, CheckCircle2, CreditCard, X, Loader2 } from "lucide-react";

export default function InscripcionesClient({ viajeId }: { viajeId: string }) {
  const [inscritos, setInscritos] = useState<InscripcionAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{ pago: string; documentos: string }>({ pago: "", documentos: "" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [creando, setCreando] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedInscrito, setSelectedInscrito] = useState<InscripcionAPI | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadInscritos = useCallback(async () => {
    try {
      const res = await requestTotemApi(`/enrollments?tripId=${encodeURIComponent(viajeId)}`);
      const data = await res.json();
      setInscritos(data.results ?? data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [viajeId]);

  useEffect(() => {
    if (!viajeId) return;
    const timeoutId = window.setTimeout(() => {
      void loadInscritos();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [viajeId, loadInscritos]);

  const handleFilterChange = (key: string, val: string) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const handleViewDetails = (inscrito: InscripcionAPI) => {
    setSelectedInscrito(inscrito);
    setIsDrawerOpen(true);
  };

  const filteredInscritos = useMemo(() => {
    return inscritos.filter((i) => {
      const matchSearch =
        i.viajero_nombre.toLowerCase().includes(search.toLowerCase()) ||
        i.viajero_email.toLowerCase().includes(search.toLowerCase());
      const matchPago = filters.pago ? i.pago_estado === filters.pago : true;
      const matchDocs = filters.documentos ? i.docs_estado === filters.documentos : true;
      return matchSearch && matchPago && matchDocs;
    });
  }, [search, filters, inscritos]);

  // Bulk actions
  const handleBulkAction = async (patch: Partial<InscripcionAPI>) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          requestTotemApi(`/enrollments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          })
        )
      );
      setInscritos((prev) =>
        prev.map((i) => (selectedIds.includes(i.id) ? { ...i, ...patch } : i))
      );
      setSelectedIds([]);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleNuevaInscripcion = async () => {
    if (!nuevoEmail.trim() || !nuevoNombre.trim()) return;
    setCreando(true);
    try {
      const res = await requestTotemApi(`/enrollments/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nuevoEmail.trim(), fullName: nuevoNombre.trim(), tripId: viajeId }),
      });
      if (res.ok) {
        setShowModal(false);
        setNuevoEmail("");
        setNuevoNombre("");
        await loadInscritos();
      } else {
        const err = await res.json();
        alert("Error: " + JSON.stringify(err));
      }
    } finally { setCreando(false); }
  };

  const handleExportCSV = () => {
    const headers = ["Nombre", "Email", "Estado", "Pago", "Documentos", "Habitacion", "Fecha inscripcion"];
    const rows = filteredInscritos.map((i) => [
      i.viajero_nombre,
      i.viajero_email,
      i.estado,
      i.pago_estado,
      i.docs_estado,
      i.tipo_habitacion ?? "",
      i.created_at ? new Date(i.created_at).toLocaleDateString("es-PE") : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscritos-${viajeId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <FiltrosInscritos
        onSearch={setSearch}
        onFilterChange={handleFilterChange}
        totalViajeros={inscritos.length}
        preInscritos={inscritos.filter(i => i.estado === "pre_inscrito").length}
        pendientePago={inscritos.filter(i => i.pago_estado === "pendiente").length}
        confirmados={inscritos.filter(i => i.estado === "confirmado").length}
        onExportCSV={handleExportCSV}
        onNuevaInscripcion={() => setShowModal(true)}
      />

      <div className="p-5 flex-1 bg-[#EEF0F8]">
        {/* Barra de acciones masivas */}
        {selectedIds.length > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#1E1E4E] px-4 py-2.5 text-white flex-wrap">
            <span className="text-[12px] font-semibold mr-1">
              {selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => handleBulkAction({ estado: "confirmado" })}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#E3F9EC] px-3 py-1 text-[11px] font-bold text-[#1A8A4A] hover:bg-[#c8f0d9] transition disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Confirmar inscripción
            </button>
            <button
              onClick={() => handleBulkAction({ pago_estado: "completo" })}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#ECE6FB] px-3 py-1 text-[11px] font-bold text-[#5B5BDB] hover:bg-[#ddd5f7] transition disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
              Marcar pago completo
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition"
            >
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
          </div>
        )}

        {/* Toolbar superior */}
        {selectedIds.length === 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-[#888]">
              {loading ? "Cargando…" : `${filteredInscritos.length} inscrito${filteredInscritos.length !== 1 ? "s" : ""}`}
            </span>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={loading || filteredInscritos.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E0E4EF] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#555] hover:bg-[#F5F6FB] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#888] text-[13px]">
            Cargando inscritos…
          </div>
        ) : (
          <TablaInscritos
            inscritos={filteredInscritos}
            onViewDetails={handleViewDetails}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </div>

      <DrawerDetalleInscripcion
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        inscrito={selectedInscrito}
      />
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-[14px] font-bold text-[#1a1a2e] mb-4">Nueva Inscripción</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Nombre Completo</label>
                <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Ej: Juan García López"
                  className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Email</label>
                <input type="email" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} placeholder="correo@ejemplo.com"
                  className="w-full rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-[#ede9f8] px-4 py-2 text-[12px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">Cancelar</button>
              <button onClick={handleNuevaInscripcion} disabled={creando || !nuevoEmail || !nuevoNombre}
                className="rounded-lg bg-[#5B4FE8] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#4a3fd0] transition disabled:opacity-60">
                {creando ? "Creando…" : "Crear Inscripción"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
