"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Copy,
  ChevronDown,
  GitBranch,
} from "lucide-react";
import { Button } from "@/shared/ui/primitives/Button";
import { Badge } from "@/shared/ui/primitives/Badge";
import { DiasPanel } from "@/contexts/itineraries/ui/admin/DiasPanel";
import { DiaEditor } from "@/contexts/itineraries/ui/admin/DiaEditor";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import type { Itinerario, DiaItinerario, EventoItinerario, Actividad } from "@/shared/domain/totem-types";

export default function ItinerarioEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [itinerario, setItinerario] = useState<Itinerario | null>(null);
  const [dias, setDias] = useState<DiaItinerario[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [diaActivoId, setDiaActivoId] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingDiaId, setSavingDiaId] = useState<string | null>(null);
  const [cloningIt, setCloningIt] = useState(false);
  const [headerDirty, setHeaderDirty] = useState(false);
  const [draftNombre, setDraftNombre] = useState("");
  const [draftDescripcion, setDraftDescripcion] = useState("");
  const [draftEstado, setDraftEstado] = useState<string>("activo");
  const [showVersionMenu, setShowVersionMenu] = useState(false);

  const diaActivo = dias.find((d) => d.id === diaActivoId) ?? null;

  const loadData = useCallback(async () => {
    setLoadingPage(true);
    try {
      const [resIt, resActs] = await Promise.all([
        requestTotemApi(`/itineraries/${id}/`),
        requestTotemApi("/itineraries/activities"),
      ]);
      if (resIt.ok) {
        const data: Itinerario = await resIt.json();
        setItinerario(data);
        setDraftNombre(data.nombre);
        setDraftDescripcion(data.descripcion ?? "");
        setDraftEstado(data.estado ?? "activo");
        const diasData = data.dias ?? [];
        setDias(diasData);
        const primerDia = diasData[0];
        if (primerDia !== undefined) setDiaActivoId(primerDia.id);
      }
      if (resActs.ok) {
        const dataActs = await resActs.json();
        const list: Actividad[] = Array.isArray(dataActs)
          ? dataActs
          : Array.isArray(dataActs?.results)
            ? dataActs.results
            : [];
        setActividades(list);
      }
    } catch (err) {
      console.error("Error cargando itinerario:", err);
    } finally {
      setLoadingPage(false);
    }
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  // ── Guardar cabecera ──────────────────────────────────────────────────────────
  const handleSaveHeader = async () => {
    if (!itinerario) return;
    setSavingHeader(true);
    try {
      const res = await requestTotemApi(`/itineraries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: draftNombre, descripcion: draftDescripcion, estado: draftEstado }),
      });
      if (res.ok) {
        const data = await res.json();
        setItinerario((prev) => prev ? { ...prev, ...data } : data);
        setHeaderDirty(false);
      }
    } finally {
      setSavingHeader(false);
    }
  };

  // ── Nueva versión ─────────────────────────────────────────────────────────────
  const handleNuevaVersion = async () => {
    if (!itinerario) return;
    setShowVersionMenu(false);
    const nuevaVersion = (itinerario.version ?? 1) + 1;
    setSavingHeader(true);
    try {
      const res = await requestTotemApi(`/itineraries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: nuevaVersion }),
      });
      if (res.ok) {
        setItinerario((prev) => prev ? { ...prev, version: nuevaVersion } : prev);
      }
    } finally {
      setSavingHeader(false);
    }
  };

  // ── Clonar ────────────────────────────────────────────────────────────────────
  const handleClonar = async () => {
    if (cloningIt) return;
    setCloningIt(true);
    try {
      const res = await requestTotemApi(`/itineraries/${id}/clonar/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const clon = await res.json();
        router.push(`/admin/itinerarios/${clon.id}/editar`);
      } else {
        alert("No se pudo clonar el itinerario.");
      }
    } finally {
      setCloningIt(false);
    }
  };

  // ── Días ──────────────────────────────────────────────────────────────────────
  const handleAgregarDia = async () => {
    const numeroDia = dias.length + 1;
    try {
      const res = await requestTotemApi(`/itineraries/${id}/dias/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero_dia: numeroDia, titulo: `Día ${numeroDia}`, resumen: "", alojamiento_pernocta: "", destino_nombre: "" }),
      });
      if (res.ok) {
        const nuevo: DiaItinerario = { ...(await res.json()), eventos: [] };
        setDias((prev) => [...prev, nuevo]);
        setDiaActivoId(nuevo.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEliminarDia = async (diaId: string) => {
    const dia = dias.find((d) => d.id === diaId);
    if (!dia) return;
    const ok = window.confirm(`¿Eliminar "${dia.titulo}"?`);
    if (!ok) return;
    try {
      const res = await requestTotemApi(`/itineraries/${id}/dias/${diaId}/`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        const filtered = dias.filter((d) => d.id !== diaId);
        // Re-numerar
        const renumbered = filtered.map((d, i) => ({ ...d, numero_dia: i + 1 }));
        setDias(renumbered);
        if (diaActivoId === diaId) setDiaActivoId(renumbered[0]?.id ?? null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoverDia = async (diaId: string, direction: "up" | "down") => {
    const idx = dias.findIndex((d) => d.id === diaId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= dias.length) return;

    const reordered = [...dias];
    const current = reordered[idx];
    const target = reordered[swapIdx];
    if (current === undefined || target === undefined) return;
    reordered[idx] = target;
    reordered[swapIdx] = current;
    const renumbered = reordered.map((d, i) => ({ ...d, numero_dia: i + 1 }));
    const currentAfterMove = renumbered[idx];
    const targetAfterMove = renumbered[swapIdx];
    if (currentAfterMove === undefined || targetAfterMove === undefined) return;
    setDias(renumbered);

    // Persiste el nuevo número de día en ambos swapped
    try {
      await Promise.all([
        requestTotemApi(`/itineraries/${id}/dias/${currentAfterMove.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numero_dia: currentAfterMove.numero_dia }),
        }),
        requestTotemApi(`/itineraries/${id}/dias/${targetAfterMove.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numero_dia: targetAfterMove.numero_dia }),
        }),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Actualizar campo de un día ────────────────────────────────────────────────
  const handleUpdateDia = async (diaId: string, changes: Partial<DiaItinerario>) => {
    setSavingDiaId(diaId);
    try {
      const res = await requestTotemApi(`/itineraries/${id}/dias/${diaId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (res.ok) {
        setDias((prev) => prev.map((d) => d.id === diaId ? { ...d, ...changes } : d));
      }
    } finally {
      setSavingDiaId(null);
    }
  };

  // ── Eventos ───────────────────────────────────────────────────────────────────
  const handleAddEvento = async (diaId: string) => {
    const dia = dias.find((d) => d.id === diaId);
    if (!dia) return;
    try {
      const res = await requestTotemApi(`/itineraries/${id}/dias/${diaId}/eventos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "texto_libre", descripcion: "", hora_inicio: null, hora_fin: null, orden: dia.eventos.length }),
      });
      if (res.ok) {
        const nuevo: EventoItinerario = await res.json();
        setDias((prev) => prev.map((d) =>
          d.id === diaId ? { ...d, eventos: [...d.eventos, { ...nuevo, actividad: null }] } : d
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateEvento = async (diaId: string, eventoId: string, changes: Partial<EventoItinerario>) => {
    try {
      const res = await requestTotemApi(`/itineraries/${id}/dias/${diaId}/eventos/${eventoId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (res.ok) {
        setDias((prev) => prev.map((d) =>
          d.id === diaId
            ? { ...d, eventos: d.eventos.map((ev) => ev.id === eventoId ? { ...ev, ...changes } : ev) }
            : d
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvento = async (diaId: string, eventoId: string) => {
    try {
      const res = await requestTotemApi(`/itineraries/${id}/dias/${diaId}/eventos/${eventoId}/`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setDias((prev) => prev.map((d) =>
          d.id === diaId ? { ...d, eventos: d.eventos.filter((ev) => ev.id !== eventoId) } : d
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoverEvento = async (diaId: string, eventoId: string, direction: "up" | "down") => {
    const dia = dias.find((d) => d.id === diaId);
    if (!dia) return;
    const idx = dia.eventos.findIndex((ev) => ev.id === eventoId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= dia.eventos.length) return;

    const eventos = [...dia.eventos];
    const current = eventos[idx];
    const target = eventos[swapIdx];
    if (current === undefined || target === undefined) return;
    eventos[idx] = target;
    eventos[swapIdx] = current;
    const reordered = eventos.map((ev, i) => ({ ...ev, orden: i }));
    const currentAfterMove = reordered[idx];
    const targetAfterMove = reordered[swapIdx];
    if (currentAfterMove === undefined || targetAfterMove === undefined) return;
    setDias((prev) => prev.map((d) => d.id === diaId ? { ...d, eventos: reordered } : d));

    try {
      await Promise.all([
        requestTotemApi(`/itineraries/${id}/dias/${diaId}/eventos/${currentAfterMove.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orden: currentAfterMove.orden }),
        }),
        requestTotemApi(`/itineraries/${id}/dias/${diaId}/eventos/${targetAfterMove.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orden: targetAfterMove.orden }),
        }),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!itinerario) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-500">Itinerario no encontrado</p>
        <Link href="/admin/itinerarios">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* ── Barra superior ── */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <Link href="/admin/itinerarios" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <input
              className="w-full text-base font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none pb-0.5 transition-colors truncate"
              value={draftNombre}
              onChange={(e) => { setDraftNombre(e.target.value); setHeaderDirty(true); }}
              placeholder="Nombre del itinerario"
            />
          </div>

          {/* Version badge + menu */}
          <div className="relative">
            <button
              onClick={() => setShowVersionMenu((v) => !v)}
              className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              v{itinerario.version}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showVersionMenu && (
              <div className="absolute right-0 top-8 z-20 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <button
                  onClick={() => void handleNuevaVersion()}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <GitBranch className="w-4 h-4 text-blue-600" />
                  Guardar como v{(itinerario.version ?? 1) + 1}
                </button>
              </div>
            )}
          </div>

          {/* Estado */}
          <select
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={draftEstado}
            onChange={(e) => { setDraftEstado(e.target.value); setHeaderDirty(true); }}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="archivado">Archivado</option>
          </select>

          {/* Descripción rápida */}
          <input
            className="hidden lg:block w-60 text-sm text-gray-500 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none pb-0.5 transition-colors"
            placeholder="Descripción breve..."
            value={draftDescripcion}
            onChange={(e) => { setDraftDescripcion(e.target.value); setHeaderDirty(true); }}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerDirty && (
            <Button size="sm" onClick={() => void handleSaveHeader()} disabled={savingHeader} className="gap-1.5">
              <Save className="w-3.5 h-3.5" />
              {savingHeader ? "Guardando..." : "Guardar"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleClonar()}
            disabled={cloningIt}
            className="gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            {cloningIt ? "Clonando..." : "Clonar"}
          </Button>
        </div>
      </header>

      {/* ── Cuerpo: panel días + editor ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel izquierdo: días */}
        <aside className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
          <DiasPanel
            dias={dias}
            diaActivoId={diaActivoId}
            onSelectDia={setDiaActivoId}
            onAgregarDia={() => void handleAgregarDia()}
            onEliminarDia={(diaId) => void handleEliminarDia(diaId)}
            onMoverDia={(diaId, dir) => void handleMoverDia(diaId, dir)}
            savingDiaId={savingDiaId}
          />
        </aside>

        {/* Panel derecho: editor del día */}
        <main className="flex-1 overflow-hidden">
          {diaActivo ? (
            <DiaEditor
              dia={diaActivo}
              actividades={actividades}
              onUpdateDia={(diaId, changes) => void handleUpdateDia(diaId, changes)}
              onAddEvento={(diaId) => void handleAddEvento(diaId)}
              onUpdateEvento={(diaId, eventoId, changes) => void handleUpdateEvento(diaId, eventoId, changes)}
              onDeleteEvento={(diaId, eventoId) => void handleDeleteEvento(diaId, eventoId)}
              onMoverEvento={(diaId, eventoId, dir) => void handleMoverEvento(diaId, eventoId, dir)}
              saving={savingDiaId === diaActivo.id}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-sm">Selecciona un día del panel izquierdo</p>
              <p className="text-xs mt-1">o crea el primer día del itinerario</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
