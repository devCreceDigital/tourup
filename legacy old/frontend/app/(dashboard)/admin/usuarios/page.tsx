"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCircle, Plus, Shield, User, Mail, RefreshCw, Loader2, AlertCircle, CheckCircle, X } from "lucide-react";
import { fetchDjango } from "@/lib/api";

interface Perfil {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  is_active: boolean;
  created_at: string;
}

interface Invitacion {
  id: string;
  email: string;
  rol: string;
  status: string;
  created_at: string;
}

const ROL_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  admin:      { bg: "bg-[#eeedfe]", text: "text-[#3c3489]", label: "Admin" },
  superadmin: { bg: "bg-[#fcebeb]", text: "text-[#a32d2d]", label: "Super Admin" },
  usuario:    { bg: "bg-[#f1efe8]", text: "text-[#5f5e5a]", label: "Usuario" },
  profesor:   { bg: "bg-[#e1f5ee]", text: "text-[#0f6e56]", label: "Profesor" },
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRol, setInvRol] = useState<"admin" | "usuario">("usuario");
  const [invNombre, setInvNombre] = useState("");
  const [invitando, setInvitando] = useState(false);
  const [invMsg, setInvMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null);

  const loadData = useCallback(async (retries = 3) => {
    setLoading(true);
    setError(null);
    try {
      const [resU, resI] = await Promise.all([
        fetchDjango("/tenant/usuarios/"),
        fetchDjango("/usuarios/invitaciones/"),
      ]);
      if (resU.status === 403 && retries > 0) {
        // Token aun no disponible, reintentar con delay
        setTimeout(() => loadData(retries - 1), 800);
        return;
      }
      if (resU.ok) {
        const data = await resU.json();
        setUsuarios(Array.isArray(data) ? data : (data.results ?? []));
      }
      if (resI.ok) {
        const data = await resI.json();
        setInvitaciones(Array.isArray(data) ? data : (data.results ?? []));
      }
      if (!resU.ok) setError("No se pudieron cargar los usuarios.");
    } catch {
      setError("Error de conexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInvitar = async () => {
    if (!invEmail.trim()) return;
    setInvitando(true);
    setInvMsg(null);
    try {
      const res = await fetchDjango("/usuarios/invitar/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invEmail.trim(), rol: invRol, nombre: invNombre.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setInvMsg({ ok: true, text: "Invitacion enviada a " + invEmail.trim() });
        setInvEmail(""); setInvNombre(""); setInvRol("usuario");
        setShowForm(false);
        await loadData();
      } else {
        setInvMsg({ ok: false, text: data.detail ?? "Error al invitar." });
      }
    } finally {
      setInvitando(false);
    }
  };

  const handleCambiarRol = async (id: string, nuevoRol: string) => {
    setCambiandoRol(id);
    try {
      const res = await fetchDjango(`/perfiles/${id}/cambiar-rol/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: nuevoRol }),
      });
      if (res.ok) {
        setUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol: nuevoRol } : u));
      } else {
        alert("No se pudo cambiar el rol.");
      }
    } finally {
      setCambiandoRol(null);
    }
  };

  const formatFecha = (f: string) => {
    if (!f) return "—";
    try { return new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return f; }
  };

  const invPendientes = invitaciones.filter(i => i.status === "pendiente");

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="bg-white rounded-xl border border-[#E0E4EF] px-6 py-4 flex items-center justify-between shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-[#5B4FE8]" />
          <span className="text-[16px] font-extrabold text-[#1a1a2e]">Equipo y Usuarios</span>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-[#eeedfe] text-[#3c3489] text-[11px] font-bold">{usuarios.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadData()} className="p-2 text-[#aaa] hover:text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setInvMsg(null); }}
            className="inline-flex items-center gap-2 bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[12px] font-bold hover:bg-[#4a3fd0] transition"
          >
            <Plus className="h-3.5 w-3.5" /> Invitar Usuario
          </button>
        </div>
      </div>

      {/* FORM INVITAR */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#5B4FE8]/30 p-5 shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-[#1a1a2e]">Invitar nuevo usuario</h3>
            <button onClick={() => setShowForm(false)} className="p-1 text-[#aaa] hover:text-[#555] rounded-lg transition"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input value={invEmail} onChange={e => setInvEmail(e.target.value)} type="email" placeholder="email@ejemplo.com" className="rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
            <input value={invNombre} onChange={e => setInvNombre(e.target.value)} placeholder="Nombre (opcional)" className="rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
            <select value={invRol} onChange={e => setInvRol(e.target.value as "admin" | "usuario")} className="rounded-lg border border-[#ede9f8] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8] bg-white">
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {invMsg && (
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-[12px] font-semibold ${invMsg.ok ? "bg-[#e1f5ee] text-[#0f6e56]" : "bg-[#fcebeb] text-[#a32d2d]"}`}>
              {invMsg.ok ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {invMsg.text}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-[#ede9f8] px-4 py-2 text-[11px] font-semibold text-[#666] hover:bg-[#f5f3fb] transition">Cancelar</button>
            <button onClick={handleInvitar} disabled={invitando || !invEmail.trim()} className="rounded-lg bg-[#5B4FE8] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#4a3fd0] transition disabled:opacity-60 flex items-center gap-1.5">
              {invitando && <Loader2 className="h-3 w-3 animate-spin" />}
              {invitando ? "Enviando..." : "Enviar Invitacion"}
            </button>
          </div>
        </div>
      )}

      {/* ESTADO */}
      {loading && (
        <div className="bg-white rounded-xl border border-[#ede9f8] p-10 flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#5B4FE8]" />
          <span className="text-[12px] text-[#aaa]">Cargando usuarios...</span>
        </div>
      )}
      {error && !loading && (
        <div className="bg-white rounded-xl border border-red-200 p-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-[12px] text-red-500">{error}</span>
          <button onClick={() => loadData()} className="ml-auto text-[11px] text-[#5B4FE8] font-semibold hover:underline">Reintentar</button>
        </div>
      )}

      {/* TABLA USUARIOS */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
          <div className="px-5 py-3 border-b border-[#e8e3f5] flex items-center gap-2">
            <User className="h-4 w-4 text-[#5B4FE8]" />
            <span className="text-[13px] font-bold text-[#1a1a2e]">Usuarios activos</span>
          </div>
          {usuarios.length === 0 ? (
            <div className="p-10 text-center">
              <UserCircle className="h-10 w-10 text-[#ddd] mx-auto mb-2" />
              <p className="text-[12px] text-[#aaa]">No hay usuarios en este tenant.</p>
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#f0edf8] bg-[#faf9ff]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Usuario</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Rol</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Miembro desde</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const badge = ROL_BADGE[u.rol] ?? ROL_BADGE.usuario;
                  return (
                    <tr key={u.id} className="border-b border-[#f5f3fb] hover:bg-[#faf9ff] transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#eeedfe] flex items-center justify-center text-[12px] font-bold text-[#3c3489] flex-shrink-0">
                            {(u.nombre || u.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a1a2e]">{u.nombre || "—"}</p>
                            <p className="text-[10px] text-[#aaa] flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                          <Shield className="h-3 w-3" />{badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#666]">{formatFecha(u.created_at)}</td>
                      <td className="px-5 py-3">
                        <select
                          value={u.rol}
                          disabled={cambiandoRol === u.id}
                          onChange={e => handleCambiarRol(u.id, e.target.value)}
                          className="rounded-lg border border-[#ede9f8] px-2 py-1 text-[11px] outline-none focus:border-[#5B4FE8] bg-white disabled:opacity-50"
                        >
                          <option value="usuario">Usuario</option>
                          <option value="admin">Admin</option>
                          <option value="profesor">Profesor</option>
                        </select>
                        {cambiandoRol === u.id && <Loader2 className="inline h-3 w-3 animate-spin text-[#5B4FE8] ml-2" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* INVITACIONES PENDIENTES */}
      {!loading && invPendientes.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
          <div className="px-5 py-3 border-b border-[#e8e3f5] flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#BA7517]" />
            <span className="text-[13px] font-bold text-[#1a1a2e]">Invitaciones pendientes</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-[#faeeda] text-[#854f0b] text-[11px] font-bold">{invPendientes.length}</span>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#f0edf8] bg-[#faf9ff]">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Email</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Rol</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Enviada</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {invPendientes.map(inv => (
                <tr key={inv.id} className="border-b border-[#f5f3fb] hover:bg-[#faf9ff] transition">
                  <td className="px-5 py-3 text-[#1a1a2e] font-semibold">{inv.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${(ROL_BADGE[inv.rol] ?? ROL_BADGE.usuario).bg} ${(ROL_BADGE[inv.rol] ?? ROL_BADGE.usuario).text}`}>
                      {inv.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#666]">{formatFecha(inv.created_at)}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faeeda] text-[#854f0b]">
                      <AlertCircle className="h-3 w-3" /> Pendiente
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
