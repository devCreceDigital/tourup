"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/shared/ui/navigation/Navbar";
import LevelBadge from "../_components/LevelBadge";
import {
  useAnalyticsSummary, useScoreDistribution, useRegionStats, useGetRankings, useListOperators,
} from "../_hooks/useOperators";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Search, Users, CheckCircle, Award, MapPin, TrendingUp,
  Globe, ArrowRight, Star, Shield, Compass, Building2, BarChart3,
  CheckCircle2, Wifi, Sparkles, LayoutDashboard, List,
} from "lucide-react";

/* ─── utilidades ─── */
function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}
const TT = {
  background: "#0d1b3e",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  fontSize: 11,
  color: "white",
};
const TICK = { fill: "rgba(255,255,255,0.4)", fontSize: 10 };

/* ─── helpers cards ─── */
import { levelColor, COVERS, HEROES } from "../_lib/constants";

const cover    = (id: number) => COVERS[id % COVERS.length];
const initials = (name: string) => name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

const LEVELS = [
  { level: "elite",    range: "90–100", desc: "World-Class",       glow: "#E6C84A" },
  { level: "premium",  range: "80–89",  desc: "High Trust",        glow: "#8B7FF0" },
  { level: "advanced", range: "70–79",  desc: "Digitally Mature",  glow: "#34D399" },
  { level: "growing",  range: "60–69",  desc: "Mid Maturity",      glow: "#22D3EE" },
  { level: "emerging", range: "40–59",  desc: "Low Digital",       glow: "#FB923C" },
  { level: "risk",     range: "0–39",   desc: "Weak Trust",        glow: "#F87171" },
];

export default function DirectorioInicioPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [heroImg, setHeroImg] = useState<string>(HEROES[0]!);
  useEffect(() => { setHeroImg(HEROES[Math.floor(Math.random() * HEROES.length)] ?? HEROES[0]!); }, []);

  const { data: summary, isLoading: loadingSum } = useAnalyticsSummary();
  const { data: distribution }                   = useScoreDistribution();
  const { data: regions }                        = useRegionStats();
  const { data: rankings, isLoading: loadingRank } = useGetRankings({ type: "nacional", limit: 10 });
  const { data: operadores, isLoading: loadingOps } = useListOperators({ sort_by: "ttdmi_score", page: 1, limit: 6 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      query.trim()
        ? `/directorio/lista?search=${encodeURIComponent(query.trim())}`
        : "/directorio/lista"
    );
  };

  const kpis = [
    { label: "Operadores",  value: summary?.total_operators?.toLocaleString()   ?? "–", icon: Users,       color: "#00B4FC" },
    { label: "Verificados", value: summary?.verified_operators?.toLocaleString() ?? "–", icon: CheckCircle, color: "#34D399" },
    { label: "Score Prom.", value: summary?.avg_ttdmi_score?.toFixed(1)           ?? "–", icon: Award,       color: "#E6C84A" },
    { label: "Regiones",    value: "25",                                              icon: MapPin,      color: "#8B7FF0" },
    { label: "Elite",       value: summary?.elite_count?.toLocaleString()           ?? "–", icon: TrendingUp,  color: "#E6C84A" },
    { label: "Hidden Gems", value: summary?.hidden_gems_count?.toLocaleString()     ?? "–", icon: Globe,       color: "#22D3EE" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A1A" }}>
      <Navbar />

      {/* ══ HERO ══ */}
      <section className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "72vh" }}>

        {/* Fondo */}
        <div className="absolute inset-0 z-0">
          <Image src={heroImg} alt="Perú" fill sizes="100vw" priority className="object-cover object-center" />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(10,10,26,0.6) 0%, rgba(10,10,26,0.55) 50%, rgba(10,10,26,0.92) 100%)" }} />
        </div>

        {/* Contenido centrado */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 text-center pt-24 pb-16">

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "rgba(0,180,252,0.15)", border: "1px solid rgba(0,180,252,0.3)", color: "#00B4FC" }}>
              <LayoutDashboard className="w-3.5 h-3.5" /> Inicio
            </span>
            <button onClick={() => router.push("/directorio/lista")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.5)" }}>
              <List className="w-3.5 h-3.5" /> Directorio
            </button>
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
              style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }}>
              <Compass className="w-3 h-3" />
              TTDMI · Registro Oficial MINCETUR
            </span>
          </div>

          {/* Título */}
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-2">
            Directorio Inteligente de
          </h1>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-5"
            style={{ color: "#38bdf8" }}>
            Prestadores Turísticos
          </h1>

          {/* Subtítulo */}
          <p className="text-white/55 text-base md:text-lg max-w-xl mx-auto mb-7 leading-relaxed">
            Índice de confianza digital, reputación y madurez operativa del ecosistema turístico peruano.{" "}
            <span className="text-white/75 font-medium">
              {loadingSum ? "..." : `${summary?.total_operators?.toLocaleString() ?? "–"} operadores registrados.`}
            </span>
          </p>

          {/* Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { icon: Building2, label: "Operadores MINCETUR" },
              { icon: MapPin,    label: "25 Regiones" },
              { icon: BarChart3, label: "Rankings TTDMI" },
              { icon: Shield,    label: "Datos Verificados" },
            ].map((p) => (
              <div key={p.label}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-white"
                style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(8px)" }}>
                <p.icon className="w-3.5 h-3.5 text-[#38bdf8]" />
                {p.label}
              </div>
            ))}
          </div>

          {/* Buscador */}
          <form onSubmit={handleSearch} className="flex max-w-lg mx-auto gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input
                type="text"
                placeholder="Buscar operador, región, tipo..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/35 outline-none"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(10px)" }}
              />
            </div>
            <button type="submit"
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#00B4FC,#5B4FE8)" }}>
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* ══ DATOS ══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 space-y-8 -mt-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((k) => (
            <div key={k.label}
              className="rounded-2xl p-4 text-center space-y-2 transition-transform hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <div className="w-9 h-9 rounded-xl mx-auto flex items-center justify-center"
                style={{ background: `${k.color}18`, border: `1px solid ${k.color}28` }}>
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              {loadingSum
                ? <Sk className="h-7 w-14 mx-auto" />
                : <p className="text-2xl font-bold tabular-nums text-white">{k.value}</p>}
              <p className="text-[11px] text-white/40 leading-tight">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Ranking + Distribución */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Top 10 */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#E6C84A]" />
                <p className="font-semibold text-sm text-white">Ranking Nacional — Top 10</p>
              </div>
              <button onClick={() => router.push("/directorio/lista")}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-[#00B4FC] transition-colors">
                Ver todos <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loadingRank ? (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => <Sk key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              rankings?.data.slice(0, 10).map((entry, idx) => (
                <div key={entry.operator_id}
                  onClick={() => router.push(`/directorio/${entry.operator_id}`)}
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.04]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>

                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={idx < 3
                      ? { background: ["#E6C84A","#9CA3AF","#CD7F32"][idx], color: "white", boxShadow: `0 0 10px ${["#E6C84A40","#9CA3AF40","#CD7F3240"][idx]}` }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    {entry.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">{entry.commercial_name}</p>
                    <p className="text-xs text-white/35 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {entry.region}{entry.operator_type ? ` · ${entry.operator_type}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {entry.verified && <Shield className="w-3.5 h-3.5 text-emerald-400" />}
                    <LevelBadge level={entry.level} size="sm" />
                    <span className="text-sm font-bold tabular-nums text-white w-10 text-right">
                      {entry.ttdmi_score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Gráficas lateral */}
          <div className="flex flex-col gap-4">

            {/* Distribución */}
            <div className="rounded-2xl p-5 flex-1"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="font-semibold text-sm text-white mb-3">Distribución TTDMI</p>

              {distribution ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={distribution} dataKey="count" nameKey="label"
                        innerRadius={42} outerRadius={68} paddingAngle={2}>
                        {distribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={TT} formatter={(v, n) => [Number(v).toLocaleString(), n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {distribution.map((d) => (
                      <div key={d.level} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-white/45 capitalize">{d.label ?? d.level}</span>
                        </div>
                        <span className="font-semibold text-white tabular-nums">{Number(d.count).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <Sk className="h-48" />}
            </div>

            {/* Top regiones */}
            <div className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="font-semibold text-sm text-white mb-3">Top Regiones</p>
              {regions ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={regions.slice(0, 5)} layout="vertical" margin={{ left: -5, right: 8, top: 0, bottom: 0 }}>
                    <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="region" tick={TICK} width={50} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TT} formatter={(v) => [Number(v).toLocaleString(), "Operadores"]} />
                    <Bar dataKey="count" fill="#00B4FC" radius={[0, 4, 4, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Sk className="h-36" />}
            </div>
          </div>
        </div>

        {/* ── Operadores destacados ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Operadores Destacados</h2>
              <p className="text-white/40 text-sm mt-0.5">Top operadores por score TTDMI</p>
            </div>
            <button onClick={() => router.push("/directorio/lista")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[#00B4FC] transition-all hover:opacity-80"
              style={{ background: "rgba(0,180,252,0.1)", border: "1px solid rgba(0,180,252,0.2)" }}>
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingOps ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Sk className="h-40 w-full rounded-none" />
                  <div className="p-4 space-y-2"><Sk className="h-4 w-3/4" /><Sk className="h-3 w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {operadores?.data.map((op) => {
                const featured = op.level === "elite" || op.level === "premium";
                return (
                  <div key={op.id}
                    onClick={() => router.push(`/directorio/${op.id}`)}
                    className={`group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${featured ? "ring-1 ring-yellow-400/20" : ""}`}
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {/* Imagen */}
                    <div className="relative h-40 overflow-hidden">
                      <img src={cover(op.id)} alt={op.commercial_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0"
                        style={{ background: "linear-gradient(to top,rgba(10,10,26,0.85) 0%,rgba(10,10,26,0.2) 55%,transparent 100%)" }} />
                      {featured && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm"
                          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                          <Sparkles className="w-3 h-3 text-yellow-400" />
                          <span className="text-[11px] font-semibold text-white">Destacado</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3"><LevelBadge level={op.level} size="sm" /></div>
                      <div className="absolute bottom-3 left-3 flex items-end gap-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold backdrop-blur-sm"
                          style={{ background: "rgba(0,180,252,0.2)", border: "1px solid rgba(0,180,252,0.3)", color: "#00B4FC" }}>
                          {initials(op.commercial_name)}
                        </div>
                        <div className="flex items-center gap-1 mb-0.5">
                          {op.verified && <Shield className="w-3 h-3 text-emerald-400" />}
                          <span className="text-xs text-white/80 font-medium">{op.region}</span>
                        </div>
                      </div>
                    </div>
                    {/* Contenido */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm text-white leading-snug line-clamp-2 group-hover:text-[#00B4FC] transition-colors">
                          {op.commercial_name}
                        </h3>
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{op.clase ?? op.operator_type}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {op.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#34D399" }}>
                            <CheckCircle2 className="w-3 h-3" /> Verificado
                          </span>
                        )}
                        {op.website && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}>
                            <Globe className="w-3 h-3" /> Web
                          </span>
                        )}
                        {op.modalidad_autorizada?.includes("Digital") && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}>
                            <Wifi className="w-3 h-3" /> Digital
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xl font-bold leading-none" style={{ color: levelColor(op.level) }}>
                              {op.ttdmi_score.toFixed(1)}
                            </p>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">TTDMI</p>
                          </div>
                          <div className="h-5 w-px bg-white/10" />
                          <div className="flex items-center gap-1 text-xs text-white/40">
                            <Star className="w-3 h-3 text-yellow-400/70" />
                            {op.ttdmi_score >= 80 ? "Excelente" : op.ttdmi_score >= 60 ? "Bueno" : "En crecimiento"}
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-[#00B4FC] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver perfil <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Niveles */}
        <div className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-4 h-4 text-[#00B4FC]" />
            <p className="font-semibold text-sm text-white">Sistema de Clasificación TTDMI</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LEVELS.map((l) => (
              <div key={l.level}
                className="rounded-xl p-4 text-center space-y-2 transition-transform hover:-translate-y-0.5"
                style={{ background: `${l.glow}08`, border: `1px solid ${l.glow}20` }}>
                <LevelBadge level={l.level} size="md" />
                <p className="text-xs font-mono font-bold text-white/50">{l.range}</p>
                <p className="text-[11px] text-white/35 leading-snug">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl px-8 py-10 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(0,180,252,0.12) 0%, rgba(91,79,232,0.12) 100%)", border: "1px solid rgba(0,180,252,0.2)" }}>
          <div className="absolute inset-0 pointer-events-none opacity-5"
            style={{ background: "radial-gradient(ellipse at 50% 0%, #00B4FC, transparent 70%)" }} />
          <div className="relative space-y-3">
            <p className="text-white/50 text-sm">¿Buscas un operador específico?</p>
            <h3 className="text-2xl font-bold text-white">
              Explora los{" "}
              <span style={{ color: "#00B4FC" }}>
                {loadingSum ? "..." : `${summary?.total_operators?.toLocaleString() ?? "10,000+"}`}
              </span>{" "}
              operadores registrados
            </h3>
            <button
              onClick={() => router.push("/directorio/lista")}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold text-white mt-2 transition-all hover:opacity-90 hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg,#00B4FC,#5B4FE8)", boxShadow: "0 0 24px rgba(0,180,252,0.25)" }}>
              Ver directorio completo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
