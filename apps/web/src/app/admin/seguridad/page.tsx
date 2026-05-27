"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCcw, ShieldCheck } from "lucide-react";
import { readTotemJson, requestTotemApi } from "@/shared/api/totem-api-client";

type PlatformEvent = {
  id: string;
  tenantId: string | null;
  source: string;
  type: string;
  aggregateId: string | null;
  receivedAt: string;
  payload: unknown;
};

type EventsResponse = {
  events: PlatformEvent[];
};

export default function SeguridadPage() {
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestTotemApi("/platform/events");
      const payload = await readTotemJson<EventsResponse>(response);
      setEvents(payload.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar auditoria.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(() => {
    const failures = events.filter((event) => /failed|rechazado|fallida|suspendido/i.test(event.type)).length;
    return {
      total: events.length,
      failures,
      sources: new Set(events.map((event) => event.source)).size
    };
  }, [events]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#1E1E4E]">Seguridad y auditoria</h1>
          <p className="text-[13px] text-[#667085]">Eventos reales emitidos por servicios del tenant y procesados por platform.</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-[#D7DBEA] bg-white px-3 py-2 text-[12px] font-semibold text-[#1E1E4E] disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Eventos" value={summary.total} />
        <Metric label="Fuentes" value={summary.sources} />
        <Metric label="Alertas" value={summary.failures} warn={summary.failures > 0} />
      </div>

      {error !== null && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[8px] border border-[#E0E4EF] bg-white">
        <div className="border-b border-[#E0E4EF] px-4 py-3">
          <span className="text-[13px] font-bold text-[#1E1E4E]">Log de eventos</span>
        </div>
        <div className="divide-y divide-[#EEF0F8]">
          {loading ? (
            <div className="px-4 py-10 text-center text-[13px] text-[#667085]">Cargando auditoria...</div>
          ) : events.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] text-[#667085]">Sin eventos registrados.</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="grid gap-2 px-4 py-3 md:grid-cols-[180px_1fr_180px]">
                <div className="text-[12px] text-[#667085]">{new Date(event.receivedAt).toLocaleString("es-PE")}</div>
                <div>
                  <div className="text-[13px] font-semibold text-[#1E1E4E]">{event.type}</div>
                  <div className="text-[12px] text-[#667085]">{event.source} · {event.aggregateId ?? "sin aggregate"}</div>
                </div>
                <div className="text-[12px] text-[#667085] md:text-right">{event.tenantId ?? "global"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-[8px] border border-[#E0E4EF] bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-[#667085]">
        {warn ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <ShieldCheck className="h-4 w-4 text-[#5B5BDB]" />}
        {label}
      </div>
      <div className="mt-2 text-[24px] font-bold text-[#1E1E4E]">{value}</div>
    </div>
  );
}
