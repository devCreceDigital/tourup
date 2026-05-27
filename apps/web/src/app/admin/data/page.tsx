"use client";
import { useState, useEffect, useCallback } from "react";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, CreditCard, Compass, Loader2, AlertCircle } from "lucide-react";

interface Stats {
  kpis: {
    viajes_activos: number;
    viajes_borrador: number;
    total_inscritos: number;
    confirmados: number;
    pagos_verificados: number;
    pagos_pendientes: number;
    ingresos_verificados: number;
    ingresos_pendientes: number;
  };
  inscripciones_por_mes: { mes: string; total: number }[];
  top_viajes: { nombre: string; inscritos: number }[];
  pagos_por_estado: { estado: string; count: number; total: number }[];
}

const COLORS = ["#5B4FE8", "#00D4C8", "#1D9E75", "#BA7517", "#a32d2d"];

const ESTADO_LABEL: Record<string, string> = {
  verificado: "Verificado",
  pendiente: "Pendiente",
  rechazado: "Rechazado",
};

function KPICard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E0E4EF] p-5 shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-[#aaa] uppercase tracking-[0.4px]">{label}</p>
        <div className={"p-2 rounded-lg " + color}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-[28px] font-extrabold text-[#1a1a2e]">{value}</p>
      {sub && <p className="text-[11px] text-[#aaa] mt-1">{sub}</p>}
    </div>
  );
}

export default function DataPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await requestTotemApi("/platform/admin-stats");
      if (!res.ok) { setError("No se pudieron cargar las estadísticas."); return; }
      setStats(await res.json());
    } catch { setError("Error al cargar estadísticas."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-[#5B4FE8]" />
      <span className="text-[12px] text-[#aaa]">Cargando estadísticas...</span>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-xl border border-red-200 p-6 flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-red-400" />
      <span className="text-[12px] text-red-500">{error}</span>
    </div>
  );

  if (!stats) return null;

  const { kpis } = stats;
  const totalIngresos = kpis.ingresos_verificados + kpis.ingresos_pendientes;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl border border-[#E0E4EF] px-6 py-4 shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#5B4FE8]" />
          <span className="text-[16px] font-extrabold text-[#1a1a2e]">Analytics</span>
          <span className="text-[11px] text-[#aaa] ml-2">Estadísticas y métricas de tu agencia</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Compass}    label="Viajes Activos"    value={kpis.viajes_activos}    sub={kpis.viajes_borrador + " en borrador"}  color="bg-[#5B4FE8]" />
        <KPICard icon={Users}      label="Total Inscritos"   value={kpis.total_inscritos}   sub={kpis.confirmados + " confirmados"}       color="bg-[#1D9E75]" />
        <KPICard icon={CreditCard} label="Pagos Verificados" value={kpis.pagos_verificados} sub={kpis.pagos_pendientes + " pendientes"}   color="bg-[#BA7517]" />
        <KPICard icon={TrendingUp} label="Ingresos Totales"  value={"S/. " + totalIngresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })} sub={"S/. " + kpis.ingresos_pendientes.toLocaleString("es-PE") + " por cobrar"} color="bg-[#a32d2d]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inscripciones por mes */}
        <div className="bg-white rounded-xl border border-[#E0E4EF] p-5 shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
          <p className="text-[13px] font-bold text-[#1a1a2e] mb-4">Inscripciones por Mes</p>
          {stats.inscripciones_por_mes.length === 0 ? (
            <p className="text-[11px] text-[#aaa] text-center py-8">Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.inscripciones_por_mes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edf8" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#aaa" }} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #ede9f8" }} />
                <Bar dataKey="total" fill="#5B4FE8" radius={[4, 4, 0, 0]} name="Inscripciones" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pagos por estado */}
        <div className="bg-white rounded-xl border border-[#E0E4EF] p-5 shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
          <p className="text-[13px] font-bold text-[#1a1a2e] mb-4">Pagos por Estado</p>
          {stats.pagos_por_estado.length === 0 ? (
            <p className="text-[11px] text-[#aaa] text-center py-8">Sin pagos aún</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={stats.pagos_por_estado} dataKey="count" nameKey="estado" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => ESTADO_LABEL[name as string] ?? name}>
                    {stats.pagos_por_estado.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length] ?? "#5B4FE8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, ESTADO_LABEL[name as string] ?? name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {stats.pagos_por_estado.map((p, i) => (
                  <div key={p.estado} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-[#1a1a2e]">{ESTADO_LABEL[p.estado] ?? p.estado}</p>
                      <p className="text-[10px] text-[#aaa]">S/. {p.total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#5B4FE8]">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top viajes */}
        <div className="bg-white rounded-xl border border-[#E0E4EF] p-5 shadow-[0_4px_24px_rgba(91,79,232,0.08)] lg:col-span-2">
          <p className="text-[13px] font-bold text-[#1a1a2e] mb-4">Top Viajes por Inscritos</p>
          {stats.top_viajes.length === 0 ? (
            <p className="text-[11px] text-[#aaa] text-center py-8">Sin viajes publicados</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.top_viajes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edf8" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#aaa" }} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11, fill: "#aaa" }} width={150} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #ede9f8" }} />
                <Bar dataKey="inscritos" fill="#00D4C8" radius={[0, 4, 4, 0]} name="Inscritos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
