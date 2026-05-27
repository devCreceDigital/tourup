"use client";

import { useState } from "react";
import { Trash2, Clock, BookOpen, Tag, ChevronUp, ChevronDown, Check, X } from "lucide-react";
import type { EventoItinerario, Actividad } from "@/types";

interface Props {
  evento: EventoItinerario;
  index: number;
  total: number;
  actividades: Actividad[];
  onUpdate: (id: string, changes: Partial<EventoItinerario>) => void;
  onDelete: (id: string) => void;
  onMover: (id: string, direction: "up" | "down") => void;
}

export function EventoItem({ evento, index, total, actividades, onUpdate, onDelete, onMover }: Props) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState({ ...evento });

  const actividadInfo = evento.tipo === "actividad_catalogo" && evento.actividad_id
    ? actividades.find((a) => a.id === evento.actividad_id)
    : null;

  const handleSave = () => {
    onUpdate(evento.id, {
      descripcion: draft.descripcion,
      hora_inicio: draft.hora_inicio,
      hora_fin: draft.hora_fin,
      actividad_id: draft.actividad_id,
      tipo: draft.tipo,
    });
    setEditando(false);
  };

  const handleCancel = () => {
    setDraft({ ...evento });
    setEditando(false);
  };

  const CATEGORIA_COLORS: Record<string, string> = {
    cultural:     "bg-purple-100 text-purple-700",
    deportiva:    "bg-orange-100 text-orange-700",
    gastronomica: "bg-yellow-100 text-yellow-700",
    naturaleza:   "bg-green-100 text-green-700",
    otro:         "bg-gray-100 text-gray-600",
  };

  return (
    <div className="group border border-[#ede9f8] rounded-xl bg-white hover:border-[#c5bff5] hover:shadow-[0_4px_12px_rgba(91,79,232,0.08)] transition-all">
      {!editando ? (
        <div className="flex items-start gap-3 p-3">
          {/* Tipo indicador */}
          <div className={`
            mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
            ${evento.tipo === "actividad_catalogo"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
            }
          `}>
            {evento.tipo === "actividad_catalogo" ? <Tag className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {(evento.hora_inicio || evento.hora_fin) && (
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  {evento.hora_inicio ?? "?"}
                  {evento.hora_fin ? ` – ${evento.hora_fin}` : ""}
                </span>
              )}
              {evento.tipo === "actividad_catalogo" && actividadInfo && (
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${CATEGORIA_COLORS[actividadInfo.categoria] ?? "bg-gray-100 text-gray-600"}`}>
                  {actividadInfo.categoria}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-800 mt-1">
              {evento.tipo === "actividad_catalogo" && actividadInfo
                ? actividadInfo.nombre
                : evento.descripcion || <span className="text-gray-400 italic">Sin descripción</span>
              }
            </p>
            {evento.tipo === "actividad_catalogo" && evento.descripcion && evento.descripcion !== actividadInfo?.nombre && (
              <p className="text-xs text-gray-500 mt-0.5">{evento.descripcion}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button onClick={() => setEditando(true)} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Editar">
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onMover(evento.id, "up")} disabled={index === 0} className="p-1 rounded-lg hover:bg-[#f0edf8] text-[#aaa] hover:text-[#5B4FE8] disabled:opacity-30 transition" title="Subir">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onMover(evento.id, "down")} disabled={index === total - 1} className="p-1 rounded-lg hover:bg-[#f0edf8] text-[#aaa] hover:text-[#5B4FE8] disabled:opacity-30 transition" title="Bajar">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(evento.id)} className="p-1 rounded hover:bg-red-50 text-red-500" title="Eliminar">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        // Modo edición
        <div className="p-4 space-y-3 bg-[#f5f3fb] rounded-xl">
          {/* Tipo de evento */}
          <div className="flex gap-2">
            <button
              onClick={() => setDraft((d) => ({ ...d, tipo: "texto_libre", actividad_id: null }))}
              className={`flex-1 text-xs py-1.5 px-2 rounded border font-medium transition-colors ${
                draft.tipo === "texto_libre"
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Texto libre
            </button>
            <button
              onClick={() => setDraft((d) => ({ ...d, tipo: "actividad_catalogo" }))}
              className={`flex-1 text-xs py-1.5 px-2 rounded border font-medium transition-colors ${
                draft.tipo === "actividad_catalogo"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Del catálogo
            </button>
          </div>

          {/* Selector de actividad (si es del catálogo) */}
          {draft.tipo === "actividad_catalogo" && (
            <select
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={draft.actividad_id ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, actividad_id: e.target.value || null }))}
            >
              <option value="">— Seleccionar actividad del catálogo —</option>
              {actividades.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} ({a.destino_nombre ?? "—"} · {a.categoria})
                </option>
              ))}
            </select>
          )}

          {/* Descripción */}
          <textarea
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder={draft.tipo === "actividad_catalogo" ? "Nota adicional (opcional)" : "Descripción del evento"}
            value={draft.descripcion}
            onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
          />

          {/* Horario */}
          <div className="flex gap-2 items-center">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="time"
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={draft.hora_inicio ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, hora_inicio: e.target.value || null }))}
            />
            <span className="text-xs text-gray-400">hasta</span>
            <input
              type="time"
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={draft.hora_fin ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, hora_fin: e.target.value || null }))}
            />
          </div>

          {/* Botones guardar/cancelar */}
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[#ede9f8] text-[#666] hover:bg-[#f5f3fb] transition">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button onClick={handleSave} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#5B4FE8] text-white hover:bg-[#4a3fd0] transition font-bold">
              <Check className="w-3.5 h-3.5" /> Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
