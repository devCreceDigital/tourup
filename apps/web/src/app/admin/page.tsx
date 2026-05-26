"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plane, Users, CreditCard, TrendingUp, PlusCircle, ArrowUpRight, Clock, CheckCircle, Brain } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { fetchAssistant } from "@/shared/api/assistant-api-client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
}

interface AssistantDashboard {
  stats: {
    totals: { sessions: number; trips: number; leads: number };
    recent: { sessions_7d: number; sessions_30d: number; trips_7d: number };
    memory: { tenant_items: number; user_items: number };
  };
  memory: Array<{
    id: string;
    scope: string;
    kind: string;
    key: string;
    content: string;
    importance: number;
    updated_at: string;
  }>;
}

const CHART_DATA = [
  { mes: "Ene", ingresos: 0, reservas: 0 },
  { mes: "Feb", ingresos: 0, reservas: 0 },
  { mes: "Mar", ingresos: 0, reservas: 0 },
  { mes: "Abr", ingresos: 0, reservas: 0 },
  { mes: "May", ingresos: 0, reservas: 0 },
  { mes: "Jun", ingresos: 0, reservas: 0 },
  { mes: "Jul", ingresos: 0, reservas: 0 },
  { mes: "Ago", ingresos: 0, reservas: 0 },
  { mes: "Sep", ingresos: 0, reservas: 0 },
  { mes: "Oct", ingresos: 0, reservas: 0 },
  { mes: "Nov", ingresos: 0, reservas: 0 },
  { mes: "Dic", ingresos: 0, reservas: 0 },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [assistant, setAssistant] = useState<AssistantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencia, setAgencia] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const res = await requestTotemApi("/platform/admin-stats");
      if (res.ok) setStats(await res.json());
      const assistantRes = await fetchAssistant("/tenant-dashboard");
      if (assistantRes.ok) setAssistant(await assistantRes.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void loadStats();
    setAgencia(localStorage.getItem("totem_nombre_agencia") || "");
  }, [loadStats]);

  const kpis = stats?.kpis;
  const fmt = (n?: number) => n?.toLocaleString("es-PE") ?? "0";
  const fmtMoney = (n?: number) => `S/. ${(n ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bienvenido de vuelta. Aquí está el resumen de tu agencia.</p>
        </div>
        <Link
          href="/admin/viajes/crear"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#5B4FE8] text-white text-sm font-medium rounded-xl hover:bg-[#4a3fd4] transition-colors shadow-lg shadow-[#5B4FE8]/25"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Viaje
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Viajes Activos",    value: fmt(kpis?.viajes_activos),    icon: Plane,       color: "bg-[#5B4FE8]/10 text-[#5B4FE8]",  trend: `+${kpis?.viajes_borrador ?? 0} en borrador` },
          { label: "Clientes Totales",  value: fmt(kpis?.total_inscritos),   icon: Users,       color: "bg-[#1D9E75]/10 text-[#1D9E75]",  trend: `+${kpis?.confirmados ?? 0} confirmados` },
          { label: "Pagos Pendientes",  value: fmtMoney(kpis?.ingresos_pendientes), icon: CreditCard, color: "bg-orange-100 text-orange-600", trend: `${kpis?.pagos_pendientes ?? 0} por cobrar` },
          { label: "Ingresos del Mes",  value: fmtMoney(kpis?.ingresos_verificados), icon: TrendingUp, color: "bg-emerald-100 text-emerald-600", trend: "verificados" },
        ].map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#ede9f8] shadow-[0_2px_12px_rgba(91,79,232,0.06)] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500 font-medium">{label}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{trend}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-5">
        {/* Chart */}
        <div className="col-span-2 bg-white rounded-2xl border border-[#ede9f8] shadow-[0_2px_12px_rgba(91,79,232,0.06)] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-gray-900">Ingresos y Reservas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Rendimiento anual 2026</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#5B4FE8]" />Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00D4C8]" />Reservas</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B4FE8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#5B4FE8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4C8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#00D4C8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0edf8" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #ede9f8", boxShadow: "0 4px 24px rgba(91,79,232,0.1)" }} />
              <Area type="monotone" dataKey="ingresos" stroke="#5B4FE8" strokeWidth={2} fill="url(#gi)" />
              <Area type="monotone" dataKey="reservas" stroke="#00D4C8" strokeWidth={2} fill="url(#gr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pagos pendientes */}
        <div className="bg-white rounded-2xl border border-[#ede9f8] shadow-[0_2px_12px_rgba(91,79,232,0.06)] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Pagos Pendientes</h2>
              <p className="text-xs text-gray-400 mt-0.5">{kpis?.pagos_pendientes ?? 0} pagos por cobrar</p>
            </div>
            <Link href="/admin/pagos" className="text-xs text-[#5B4FE8] hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {kpis?.pagos_pendientes === 0 || !kpis ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <CheckCircle className="w-10 h-10 mb-2" />
              <p className="text-sm text-gray-400">Sin pagos pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(Math.min(kpis.pagos_pendientes, 3))].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#f0edf8]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#5B4FE8]/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-[#5B4FE8]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Pago pendiente</p>
                      <p className="text-xs text-gray-400">Por verificar</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Pendiente</span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/admin/pagos"
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#5B4FE8] text-white text-sm font-medium rounded-xl hover:bg-[#4a3fd4] transition-colors"
          >
            Gestionar pagos
          </Link>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-3 gap-5">
        {/* Viajes activos */}
        <div className="col-span-2 bg-white rounded-2xl border border-[#ede9f8] shadow-[0_2px_12px_rgba(91,79,232,0.06)] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Viajes Activos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Gestiona tus próximos viajes</p>
            </div>
            <Link href="/admin/viajes" className="text-xs text-[#5B4FE8] hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {loading || !kpis?.viajes_activos ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <Plane className="w-10 h-10 mb-2" />
              <p className="text-sm text-gray-400">No hay viajes activos aún</p>
              <Link href="/admin/viajes/crear" className="mt-3 text-xs text-[#5B4FE8] hover:underline">
                Crear primer viaje →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(Math.min(kpis.viajes_activos, 2))].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-[#ede9f8] hover:border-[#5B4FE8]/30 transition-colors">
                  <div className="w-16 h-12 bg-gradient-to-br from-[#5B4FE8]/20 to-[#00D4C8]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Plane className="w-5 h-5 text-[#5B4FE8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">Viaje activo</p>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#5B4FE8] to-[#00D4C8] rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0">Activo</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#ede9f8] shadow-[0_2px_12px_rgba(91,79,232,0.06)] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Memoria IA del Tenant</h2>
              <p className="text-xs text-gray-400 mt-0.5">Contexto que el agente puede reutilizar</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#5B4FE8]/10 text-[#5B4FE8] flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl bg-[#f0edf8]/60 p-3">
              <p className="text-[11px] text-gray-500">Sesiones</p>
              <p className="text-lg font-bold text-gray-900">{fmt(assistant?.stats.totals.sessions)}</p>
            </div>
            <div className="rounded-xl bg-[#f0edf8]/60 p-3">
              <p className="text-[11px] text-gray-500">Leads IA</p>
              <p className="text-lg font-bold text-gray-900">{fmt(assistant?.stats.totals.leads)}</p>
            </div>
            <div className="rounded-xl bg-[#f0edf8]/60 p-3">
              <p className="text-[11px] text-gray-500">Memorias</p>
              <p className="text-lg font-bold text-gray-900">{fmt((assistant?.stats.memory.tenant_items ?? 0) + (assistant?.stats.memory.user_items ?? 0))}</p>
            </div>
          </div>
          {assistant?.memory.length ? (
            <div className="space-y-2">
              {assistant.memory.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-[#ede9f8] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#5B4FE8]">{item.scope}/{item.kind}</span>
                    <span className="text-[11px] text-gray-400">{Math.round(item.importance * 100)}%</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-gray-300">
              <Brain className="w-9 h-9 mb-2" />
              <p className="text-sm text-gray-400">Sin memoria IA registrada aún</p>
            </div>
          )}
          <Link href="/admin/asistente-ia/leads" className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#5B4FE8] text-white text-sm font-medium rounded-xl hover:bg-[#4a3fd4] transition-colors">
            Gestionar asistente
          </Link>
        </div>

        {/* Clientes recientes */}
        <div className="bg-white rounded-2xl border border-[#ede9f8] shadow-[0_2px_12px_rgba(91,79,232,0.06)] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Clientes Recientes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimas inscripciones</p>
            </div>
            <Link href="/admin/reservas" className="text-xs text-[#5B4FE8] hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {!kpis?.total_inscritos ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <Users className="w-10 h-10 mb-2" />
              <p className="text-sm text-gray-400">Sin clientes aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(Math.min(kpis.total_inscritos, 3))].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5B4FE8] to-[#00D4C8] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">Cliente inscrito</p>
                    <p className="text-xs text-gray-400">Inscripción reciente</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">Confirmado</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
