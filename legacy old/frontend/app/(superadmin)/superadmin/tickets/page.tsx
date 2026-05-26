"use client";

import { useEffect, useState } from "react";
import { Headphones, Filter, Send, X } from "lucide-react";
import { fetchDjango } from "@/lib/api";

interface Ticket {
  id: string;
  asunto: string;
  descripcion: string;
  prioridad: "baja" | "normal" | "urgente";
  estado: "abierto" | "en_progreso" | "resuelto" | "cerrado";
  admin_email: string;
  tenant_id: string;
  respuesta: string | null;
  created_at: string;
}

const PRIORIDAD_STYLE: Record<string, string> = {
  baja:    "bg-gray-100 text-gray-500",
  normal:  "bg-blue-100 text-blue-700",
  urgente: "bg-red-100 text-red-600",
};
const ESTADO_STYLE: Record<string, string> = {
  abierto:     "bg-yellow-100 text-yellow-700",
  en_progreso: "bg-blue-100 text-blue-700",
  resuelto:    "bg-green-100 text-green-700",
  cerrado:     "bg-gray-100 text-gray-500",
};

export default function TicketsPage() {
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [modal, setModal]             = useState<Ticket | null>(null);
  const [respuesta, setRespuesta]     = useState("");
  const [guardando, setGuardando]     = useState(false);

  useEffect(() => {
    fetchDjango("/soporte/tickets/list/")
      .then(r => r.json())
      .then((d) => setTickets(Array.isArray(d) ? d : Array.isArray(d.results) ? d.results : []))
      .finally(() => setLoading(false));
  }, []);

  const abrirModal = (t: Ticket) => {
    setModal(t);
    setRespuesta(t.respuesta ?? "");
  };

  const guardar = async (estado: string) => {
    if (!modal) return;
    setGuardando(true);
    await fetchDjango(`/soporte/tickets/${modal.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ estado, respuesta }),
    });
    setTickets((prev) =>
      prev.map((t) => t.id === modal.id ? { ...t, estado: estado as Ticket["estado"], respuesta } : t)
    );
    setModal(null);
    setGuardando(false);
  };

  const filtrados = tickets.filter((t) =>
    filtroEstado === "todos" ? true : t.estado === filtroEstado
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets de soporte</h1>
          <p className="text-gray-500 text-sm mt-1">
            {tickets.filter((t) => t.estado === "abierto").length} abiertos · {tickets.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="text-sm border border-[#ede9f8] rounded-lg px-3 py-2 focus:outline-none focus:border-[#5B4FE8]"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="abierto">Abiertos</option>
            <option value="en_progreso">En progreso</option>
            <option value="resuelto">Resueltos</option>
            <option value="cerrado">Cerrados</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#ede9f8] p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-72" />
            </div>
          ))
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#ede9f8] p-16 text-center text-gray-400">
            <Headphones className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No hay tickets
          </div>
        ) : (
          filtrados.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-[#ede9f8] shadow-[0_4px_24px_rgba(91,79,232,0.06)] p-5 cursor-pointer hover:border-[#5B4FE8]/30 transition-all"
              onClick={() => abrirModal(t)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORIDAD_STYLE[t.prioridad]}`}>
                      {t.prioridad.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_STYLE[t.estado]}`}>
                      {t.estado.replace("_", " ")}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{t.asunto}</p>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{t.descripcion}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{t.admin_email}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{new Date(t.created_at).toLocaleDateString("es-PE")}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal responder */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#ede9f8]">
              <h2 className="font-semibold text-gray-900">Responder ticket</h2>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORIDAD_STYLE[modal.prioridad]}`}>
                    {modal.prioridad.toUpperCase()}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{modal.asunto}</p>
                <p className="text-sm text-gray-500 mt-1">{modal.descripcion}</p>
                <p className="text-xs text-gray-400 mt-1">De: {modal.admin_email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Respuesta</label>
                <textarea
                  className="w-full border border-[#ede9f8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8] min-h-[100px] resize-none"
                  placeholder="Escribe tu respuesta..."
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => guardar("en_progreso")}
                  disabled={guardando}
                  className="flex-1 py-2.5 text-sm border border-[#ede9f8] rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  En progreso
                </button>
                <button
                  onClick={() => guardar("resuelto")}
                  disabled={guardando || !respuesta.trim()}
                  className="flex-1 py-2.5 text-sm bg-[#5B4FE8] text-white rounded-lg hover:bg-[#4a3fd4] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Resolver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
