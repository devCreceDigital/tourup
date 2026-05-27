"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle, XCircle, PauseCircle, Search } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: "active" | "inactive" | "suspended";
  plan_id: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  active:    "Activo",
  inactive:  "Inactivo",
  suspended: "Suspendido",
};
const STATUS_STYLE: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  inactive:  "bg-gray-100 text-gray-500",
  suspended: "bg-red-100 text-red-600",
};

export default function AgenciasPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState("");
  const [accion, setAccion]   = useState<string | null>(null);

  useEffect(() => {
    requestTotemApi("/platform/tenants")
      .then(r => r.json())
      .then((d) => setTenants(Array.isArray(d) ? d : Array.isArray(d.results) ? d.results : []))
      .finally(() => setLoading(false));
  }, []);

  const cambiarEstado = async (id: string, status: string) => {
    setAccion(id);
    await requestTotemApi(`/platform/tenants/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setTenants((prev) => prev.map((t) => t.id === id ? { ...t, status: status as Tenant["status"] } : t));
    setAccion(null);
  };

  const filtrados = tenants.filter((t) =>
    t.name.toLowerCase().includes(q.toLowerCase()) ||
    t.domain?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agencias</h1>
          <p className="text-gray-500 text-sm mt-1">{tenants.length} agencias registradas</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 text-sm border border-[#ede9f8] rounded-lg focus:outline-none focus:border-[#5B4FE8] w-60"
            placeholder="Buscar agencia..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#ede9f8] shadow-[0_4px_24px_rgba(91,79,232,0.08)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f0edf8] text-gray-600 border-b border-[#ede9f8]">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Agencia</th>
              <th className="text-left px-5 py-3 font-medium">Dominio</th>
              <th className="text-left px-5 py-3 font-medium">Estado</th>
              <th className="text-left px-5 py-3 font-medium">Plan</th>
              <th className="text-left px-5 py-3 font-medium">Registrada</th>
              <th className="text-right px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ede9f8]">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No hay agencias
                </td>
              </tr>
            ) : (
              filtrados.map((t) => (
                <tr key={t.id} className="hover:bg-[#f0edf8]/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{t.name}</td>
                  <td className="px-5 py-4 text-gray-500">{t.domain || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[t.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{t.plan_id ? t.plan_id.slice(0, 8) + "…" : "Sin plan"}</td>
                  <td className="px-5 py-4 text-gray-500">{new Date(t.created_at).toLocaleDateString("es-PE")}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {t.status !== "active" && (
                        <button
                          onClick={() => cambiarEstado(t.id, "active")}
                          disabled={accion === t.id}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                          title="Activar"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {t.status === "active" && (
                        <button
                          onClick={() => cambiarEstado(t.id, "suspended")}
                          disabled={accion === t.id}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                          title="Suspender"
                        >
                          <PauseCircle className="w-4 h-4" />
                        </button>
                      )}
                      {t.status !== "inactive" && (
                        <button
                          onClick={() => cambiarEstado(t.id, "inactive")}
                          disabled={accion === t.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Desactivar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
