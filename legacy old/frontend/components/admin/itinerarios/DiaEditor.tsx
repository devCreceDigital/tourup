"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Building2, MapPin, AlignLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EventoItem } from "./EventoItem";
import type { DiaItinerario, EventoItinerario, Actividad } from "@/types";

interface Props {
  dia: DiaItinerario;
  actividades: Actividad[];
  onUpdateDia: (id: string, changes: Partial<DiaItinerario>) => void;
  onAddEvento: (diaId: string) => void;
  onUpdateEvento: (diaId: string, eventoId: string, changes: Partial<EventoItinerario>) => void;
  onDeleteEvento: (diaId: string, eventoId: string) => void;
  onMoverEvento: (diaId: string, eventoId: string, direction: "up" | "down") => void;
  saving: boolean;
}

export function DiaEditor({
  dia,
  actividades,
  onUpdateDia,
  onAddEvento,
  onUpdateEvento,
  onDeleteEvento,
  onMoverEvento,
  saving,
}: Props) {
  const [draftTitulo, setDraftTitulo] = useState(dia.titulo);
  const [draftDestino, setDraftDestino] = useState(dia.destino_nombre ?? "");
  const [draftAlojamiento, setDraftAlojamiento] = useState(dia.alojamiento_pernocta ?? "");
  const [draftResumen, setDraftResumen] = useState(dia.resumen ?? "");
  const [fieldsDirty, setFieldsDirty] = useState(false);
  const prevDiaId = useRef(dia.id);

  useEffect(() => {
    if (prevDiaId.current !== dia.id) {
      setDraftTitulo(dia.titulo);
      setDraftDestino(dia.destino_nombre ?? "");
      setDraftAlojamiento(dia.alojamiento_pernocta ?? "");
      setDraftResumen(dia.resumen ?? "");
      setFieldsDirty(false);
      prevDiaId.current = dia.id;
    }
  }, [dia]);

  const markDirty = (setter: (v: string) => void, value: string) => {
    setter(value);
    setFieldsDirty(true);
  };

  const handleSaveDia = () => {
    onUpdateDia(dia.id, {
      titulo: draftTitulo,
      destino_nombre: draftDestino,
      alojamiento_pernocta: draftAlojamiento,
      resumen: draftResumen,
    });
    setFieldsDirty(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header del día */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Día {dia.numero_dia}
          </span>
          {fieldsDirty && (
            <Button size="sm" onClick={handleSaveDia} disabled={saving} className="gap-1.5">
              <Save className="w-3.5 h-3.5" />
              {saving ? "Guardando..." : "Guardar día"}
            </Button>
          )}
        </div>

        <input
          className="w-full text-lg font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none pb-1 transition-colors"
          placeholder="Título del día"
          value={draftTitulo}
          onChange={(e) => markDirty(setDraftTitulo, e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Destino del día"
              value={draftDestino}
              onChange={(e) => markDirty(setDraftDestino, e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Alojamiento (pernocta)"
              value={draftAlojamiento}
              onChange={(e) => markDirty(setDraftAlojamiento, e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-start gap-2 mt-3">
          <AlignLeft className="w-4 h-4 text-gray-400 shrink-0 mt-1.5" />
          <textarea
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Resumen del día (opcional)"
            value={draftResumen}
            onChange={(e) => markDirty(setDraftResumen, e.target.value)}
          />
        </div>
      </div>

      {/* Eventos */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Eventos ({dia.eventos.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => onAddEvento(dia.id)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Agregar evento
          </Button>
        </div>

        {dia.eventos.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
            <p>Sin eventos en este día</p>
            <p className="text-xs mt-1">Agrega actividades, traslados o notas del itinerario</p>
          </div>
        )}

        {dia.eventos.map((ev, idx) => (
          <EventoItem
            key={ev.id}
            evento={ev}
            index={idx}
            total={dia.eventos.length}
            actividades={actividades}
            onUpdate={(id, changes) => onUpdateEvento(dia.id, id, changes)}
            onDelete={(id) => onDeleteEvento(dia.id, id)}
            onMover={(id, dir) => onMoverEvento(dia.id, id, dir)}
          />
        ))}
      </div>
    </div>
  );
}
