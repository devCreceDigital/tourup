"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Search, Eye, Mail, Calendar, MapPin, Loader2, AlertCircle } from "lucide-react";
import { fetchDjango } from "@/lib/api";

interface Viajero {
  id: string;
  viajero_nombre: string;
  viajero_email: string;
  viaje_nombre: string;
  estado: string;
  pago_estado: string;
  created_at: string;
}

const ESTADO_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pre_inscrito: { bg: "bg-[#faeeda]", text: "text-[#854f0b]", label: "Pre Inscrito" },
  confirmado:   { bg: "bg-[#e1f5ee]", text: "text-[#0f6e56]", label: "Confirmado" },
  cancelado:    { bg: "bg-[#fcebeb]", text: "text-[#a32d2d]", label: "Cancelado" },
  en_viaje:     { bg: "bg-[#e8e3f5]", text: "text-[#5B4FE8]", label: "En Viaje" },
};

export default function ViajerosPage() {
  const [viajeros, setViajeros] = useState<Viajero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadViajeros = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDjango("/admin/inscripciones-por-usuario/");
      if (!res.ok) { setError("No se pudieron cargar los viajeros."); return; }
      const data = await res.json();
      // El endpoint devuelve {usuarios: [{viajero_nombre, viajero_email, inscripciones: [...]}]}
      if (data.usuarios) {
        const lista: Viajero[] = [];
        for (const u of data.usuarios) {
          for (const insc of u.inscripciones) {
            lista.push({
              id: insc.id,
              viajero_nombre: u.viajero_nombre,
              viajero_email: u.viajero_email,
              viaje_nombre: insc.viaje_nombre,
              estado: insc.estado,
              pago_estado: "",
              created_at: insc.created_at,
            });
          }
        }
        setViajeros(lista);
      } else {
        setViajeros(Array.isArray(data) ? data : (data.results ?? []));
      }
    } catch {
      setError("Error al cargar viajeros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadViajeros(); }, [loadViajeros]);

  const filtrados = viajeros.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (v.viajero_nombre || "").toLowerCase().includes(q) ||
      (v.viajero_email || "").toLowerCase().includes(q) ||
      (v.viaje_nombre || "").toLowerCase().includes(q)
    );
  });

  const formatFecha = (f: string) => {
    try { return new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return f; }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-[#E0E4EF] px-6 py-4 flex items-center justify-between shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-[#5B4FE8]" />
          <div>
            <span className="text-[16px] font-extrabold text-[#1a1a2e]">Viajeros</span>
            <p className="text-[11px] text-[#aaa]">Lista de inscritos en tus viajes</p>
          </div>
        </div>
        <div className="text-[13px] font-bold text-[#5B4FE8]">{viajeros.length} viajeros</div>
      </div>

      <div className="bg-white rounded-xl border border-[#E0E4EF] px-4 py-3 flex items-center gap-3 shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        <Search className="h-4 w-4 text-[#aaa] flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o viaje..."
          className="flex-1 text-[12px] outline-none text-[#1a1a2e] placeholder:text-[#ccc]"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[#5B4FE8]" />
            <span className="text-[12px] text-[#aaa]">Cargando viajeros...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-[12px] text-red-500">{error}</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-10 w-10 text-[#ddd] mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-[#aaa]">{search ? "Sin resultados" : "No hay viajeros aun"}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#f8f6fe] border-b border-[#ede9f8]">
              <tr>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Viajero</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Viaje</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Estado</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Pago</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Fecha</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-[0.4px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f3fb]">
              {filtrados.map((v) => {
                const cfg = ESTADO_CONFIG[v.estado] ?? { bg: "bg-[#f5f3fb]", text: "text-[#666]", label: v.estado };
                return (
                  <tr key={v.id} className="hover:bg-[#faf9fe] transition">
                    <td className="px-5 py-3">
                      <p className="text-[12px] font-semibold text-[#1a1a2e]">{v.viajero_nombre || "—"}</p>
                      <p className="text-[11px] text-[#aaa] flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />{v.viajero_email || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[12px] font-semibold text-[#1a1a2e] flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#aaa]" />{v.viaje_nombre || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold " + cfg.bg + " " + cfg.text}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] text-[#666] capitalize">{v.pago_estado || "—"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] text-[#aaa] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{formatFecha(v.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={"/admin/reservas/" + v.id} className="p-1.5 text-[#aaa] hover:text-[#5B4FE8] hover:bg-[#f0edf8] rounded-lg transition inline-flex">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
