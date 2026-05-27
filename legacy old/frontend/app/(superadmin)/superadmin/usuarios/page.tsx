"use client";

import { useEffect, useState } from "react";
import { Users, Search, Shield, ShieldOff } from "lucide-react";
import { fetchDjango } from "@/lib/api";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
}

const ROL_STYLE: Record<string, string> = {
  superadmin:  "bg-purple-100 text-purple-700",
  admin:       "bg-blue-100 text-blue-700",
  coordinador: "bg-teal-100 text-teal-700",
  docente:     "bg-orange-100 text-orange-700",
  usuario:     "bg-gray-100 text-gray-500",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  useEffect(() => {
    fetchDjango("/superadmin/usuarios/")
      .then(r => r.json())
      .then((d) => setUsuarios(Array.isArray(d) ? d : Array.isArray(d.results) ? d.results : []))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = usuarios.filter((u) => {
    const matchQ   = u.nombre?.toLowerCase().includes(q.toLowerCase()) ||
                     u.email.toLowerCase().includes(q.toLowerCase());
    const matchRol = filtroRol === "todos" || u.rol === filtroRol;
    return matchQ && matchRol;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios del sistema</h1>
          <p className="text-gray-500 text-sm mt-1">{usuarios.length} usuarios registrados</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="text-sm border border-[#ede9f8] rounded-lg px-3 py-2 focus:outline-none focus:border-[#5B4FE8]"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="coordinador">Coordinador</option>
            <option value="docente">Docente</option>
            <option value="usuario">Usuario</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-9 pr-4 py-2 text-sm border border-[#ede9f8] rounded-lg focus:outline-none focus:border-[#5B4FE8] w-56"
              placeholder="Buscar usuario..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#ede9f8] shadow-[0_4px_24px_rgba(91,79,232,0.08)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f0edf8] text-gray-600 border-b border-[#ede9f8]">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Nombre</th>
              <th className="text-left px-5 py-3 font-medium">Email</th>
              <th className="text-left px-5 py-3 font-medium">Rol</th>
              <th className="text-left px-5 py-3 font-medium">Estado</th>
              <th className="text-left px-5 py-3 font-medium">Tenant</th>
              <th className="text-left px-5 py-3 font-medium">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ede9f8]">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No hay usuarios
                </td>
              </tr>
            ) : (
              filtrados.map((u) => (
                <tr key={u.id} className="hover:bg-[#f0edf8]/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{u.nombre || "—"}</td>
                  <td className="px-5 py-4 text-gray-500">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROL_STYLE[u.rol] ?? "bg-gray-100 text-gray-500"}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.is_active ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs">
                        <Shield className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400 text-xs">
                        <ShieldOff className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs font-mono">
                    {u.tenant_id ? u.tenant_id.slice(0, 8) + "…" : "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-400">
                    {new Date(u.created_at).toLocaleDateString("es-PE")}
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
