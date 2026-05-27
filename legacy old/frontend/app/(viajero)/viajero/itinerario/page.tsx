"use client";

import { useState, useEffect, useMemo } from "react";
import { Compass, MapPin, Calendar, Clock, BedDouble } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchDjango } from "@/lib/api";
import TripMap from "@/components/shared/TripMap";
import { resolveDestinations } from "@/lib/geoHelper";

type EventoAPI = {
  id: string;
  tipo: string;
  descripcion: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  actividad_id: string | null;
  orden: number;
};

type DiaAPI = {
  id: string;
  numero_dia: number;
  titulo: string;
  resumen: string;
  alojamiento_pernocta: string;
  destino_nombre: string;
  eventos: EventoAPI[];
};

type ItinerarioAPI = {
  id: string;
  nombre: string;
  descripcion: string;
  dias: DiaAPI[];
};

type ViajeAPI = {
  id: string;
  itinerario_id: string | null;
};

export default function ViajeroItinerarioPage() {
  const [itinerario, setItinerario] = useState<ItinerarioAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const routeMarkers = useMemo(() => {
    if (!itinerario) return []
    const seen = new Set<string>()
    const markers: { lat: number; lng: number; label: string }[] = []
    const sorted = [...itinerario.dias].sort((a, b) => a.numero_dia - b.numero_dia)
    for (const dia of sorted) {
      if (!dia.destino_nombre || seen.has(dia.destino_nombre)) continue
      seen.add(dia.destino_nombre)
      const resolved = resolveDestinations(dia.destino_nombre)
      if (resolved.length) markers.push(resolved[0])
    }
    return markers
  }, [itinerario])

  useEffect(() => {
    const load = async () => {
      try {
        const inscRes = await fetchDjango("/mis-inscripciones/");
        const inscData = await inscRes.json();
        const inscripciones = inscData.results ?? inscData;
        if (!inscripciones.length) {
          setError("No tienes inscripciones activas.");
          return;
        }

        const viajeId = inscripciones[0].viaje;
        const viajeRes = await fetchDjango(`/viajes/${viajeId}/`);
        const viaje: ViajeAPI = await viajeRes.json();

        if (!viaje.itinerario_id) {
          setError("El itinerario de tu viaje aún no está disponible.");
          return;
        }

        const iRes = await fetchDjango(`/itinerarios/${viaje.itinerario_id}/`);
        const iData: ItinerarioAPI = await iRes.json();
        setItinerario(iData);
      } catch {
        setError("No se pudo cargar el itinerario.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        Cargando itinerario…
      </div>
    );
  }

  if (error || !itinerario) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-[#1E1E4E] flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#5B5BDB]" />
            Itinerario
          </h1>
        </div>
        <div className="bg-[#F5F6FB] rounded-xl p-8 text-center text-gray-500 text-sm">
          {error ?? "No hay itinerario disponible por el momento."}
        </div>
      </div>
    );
  }

  const diasOrdenados = [...itinerario.dias].sort((a, b) => a.numero_dia - b.numero_dia);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#1E1E4E] flex items-center gap-2">
          <Compass className="w-6 h-6 text-[#5B5BDB]" />
          Itinerario
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {itinerario.nombre} — conoce el programa día a día de tu viaje.
        </p>
      </div>

      {routeMarkers.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <TripMap markers={routeMarkers} height="220px" showRoute />
        </div>
      )}

      <div className="relative border-l-2 border-[#5B5BDB] ml-4 md:ml-6 mt-4 pl-6 md:pl-10 space-y-10">
        {diasOrdenados.map((dia, idx) => {
          const isFirst = idx === 0;
          const eventosOrdenados = [...dia.eventos].sort((a, b) => a.orden - b.orden);

          return (
            <div key={dia.id} className="relative">
              <div
                className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs -left-[37px] md:-left-[53px] ring-4 ring-white ${
                  isFirst ? "bg-[#5B5BDB]" : "bg-gray-300"
                }`}
              >
                {dia.numero_dia}
              </div>

              <Card className={`p-5 ${!isFirst ? "opacity-80" : ""}`}>
                <div className="flex items-start justify-between mb-4 border-b border-gray-100 pb-3">
                  <div>
                    <div
                      className={`font-bold text-sm mb-1 flex items-center gap-1.5 ${
                        isFirst ? "text-[#5B5BDB]" : "text-gray-500"
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      {dia.destino_nombre && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {dia.destino_nombre}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-[#1E1E4E]">{dia.titulo}</h3>
                    {dia.resumen && (
                      <p className="text-sm text-gray-500 mt-1">{dia.resumen}</p>
                    )}
                  </div>
                  <Badge variant={isFirst ? "blue" : "gray"}>Día {dia.numero_dia}</Badge>
                </div>

                {eventosOrdenados.length > 0 ? (
                  <div className="space-y-4">
                    {eventosOrdenados.map((evento) => (
                      <div key={evento.id} className="flex gap-4">
                        {evento.hora_inicio && (
                          <div className="text-gray-400 font-bold w-12 text-right pt-1 text-sm shrink-0">
                            {evento.hora_inicio.slice(0, 5)}
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-lg flex-1 border ${
                            isFirst
                              ? "bg-blue-50 border-blue-100"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <p className="font-bold text-[#1E1E4E] flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            {evento.hora_fin
                              ? `${evento.hora_inicio?.slice(0, 5)} — ${evento.hora_fin.slice(0, 5)}`
                              : evento.hora_inicio?.slice(0, 5)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{evento.descripcion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Los detalles de este día estarán disponibles pronto.
                  </p>
                )}

                {dia.alojamiento_pernocta && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                    <BedDouble className="w-4 h-4" />
                    Alojamiento: <span className="font-medium">{dia.alojamiento_pernocta}</span>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
