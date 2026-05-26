"use client";

import { Plus, Trash2, ChevronUp, ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/shared/ui/primitives/Button";
import type { DiaItinerario } from "@/shared/domain/totem-types";

interface Props {
  dias: DiaItinerario[];
  diaActivoId: string | null;
  onSelectDia: (id: string) => void;
  onAgregarDia: () => void;
  onEliminarDia: (id: string) => void;
  onMoverDia: (id: string, direction: "up" | "down") => void;
  savingDiaId: string | null;
}

export function DiasPanel({
  dias,
  diaActivoId,
  onSelectDia,
  onAgregarDia,
  onEliminarDia,
  onMoverDia,
  savingDiaId,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-700">
          Días ({dias.length})
        </span>
        <Button size="sm" onClick={onAgregarDia} className="gap-1">
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
        {dias.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            Sin días aún
          </div>
        )}
        {dias.map((dia, idx) => {
          const isActive = dia.id === diaActivoId;
          const isSaving = savingDiaId === dia.id;
          return (
            <div
              key={dia.id}
              onClick={() => onSelectDia(dia.id)}
              className={`
                group relative rounded-lg px-3 py-2.5 cursor-pointer transition-all
                ${isActive
                  ? "bg-blue-50 border border-blue-200 shadow-sm"
                  : "hover:bg-gray-50 border border-transparent"
                }
                ${isSaving ? "opacity-60" : ""}
              `}
            >
              <div className="flex items-start gap-2">
                <span className={`
                  text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5
                  ${isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}
                `}>
                  {dia.numero_dia}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? "text-blue-900" : "text-gray-800"}`}>
                    {dia.titulo || `Día ${dia.numero_dia}`}
                  </p>
                  {dia.destino_nombre && (
                    <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 inline" />
                      {dia.destino_nombre}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dia.eventos.length} evento{dia.eventos.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Controles: aparecen al hover o cuando está activo */}
              <div className={`
                absolute right-1.5 top-1.5 flex flex-col gap-0.5
                ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                transition-opacity
              `}>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoverDia(dia.id, "up"); }}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30"
                  title="Subir"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoverDia(dia.id, "down"); }}
                  disabled={idx === dias.length - 1}
                  className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30"
                  title="Bajar"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onEliminarDia(dia.id); }}
                  className="p-0.5 rounded hover:bg-red-100 text-red-500"
                  title="Eliminar día"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
