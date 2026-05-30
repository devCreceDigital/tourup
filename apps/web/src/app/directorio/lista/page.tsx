"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/shared/ui/navigation/Navbar";
import LevelBadge from "../_components/LevelBadge";
import {
  useListOperators, useAnalyticsSummary,
  useScoreDistribution, useGetRankings,
} from "../_hooks/useOperators";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Search, Filter, MapPin, Globe, ChevronLeft, ChevronRight,
  Wifi, LayoutGrid, Table2, Star, CheckCircle2, Shield,
  TrendingUp, ArrowRight, Sparkles, X, Users, Award,
  CheckCircle, BarChart3,
} from "lucide-react";

/* ── constantes ── */
import { levelColor, COVERS, HEROES, REGIONS, CLASES, LEVELS } from "../_lib/constants";

const MODALIDADES = ["Digital","Presencial","Digital, Presencial"];

const cover    = (id: number) => COVERS[id % COVERS.length];
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const TT = { background:"#0d1b3e", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, fontSize:11, color:"white" };

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/8 ${className}`} />;
}

/* ── Card operador ── */
function OperatorCard({ op, onClick }: { op: any; onClick: () => void }) {
  const featured = op.level === "elite" || op.level === "premium";
  return (
    <div onClick={onClick}
      className={`group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 ${featured ? "ring-1 ring-yellow-400/20" : ""}`}
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
      <div className="relative h-32 overflow-hidden">
        <img src={cover(op.id)} alt={op.commercial_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top,rgba(8,8,20,0.9) 0%,rgba(8,8,20,0.15) 55%,transparent 100%)" }} />
        {featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 backdrop-blur-sm"
            style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)" }}>
            <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
            <span className="text-[9px] font-semibold text-white">Destacado</span>
          </div>
        )}
        <div className="absolute top-2 right-2"><LevelBadge level={op.level} size="sm" /></div>
        <div className="absolute bottom-2 left-2.5 flex items-end gap-1.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold"
            style={{ background:"rgba(0,180,252,0.22)", border:"1px solid rgba(0,180,252,0.35)", color:"#00B4FC" }}>
            {initials(op.commercial_name)}
          </div>
          <div className="flex items-center gap-1 mb-0.5">
            {op.verified && <Shield className="w-2.5 h-2.5 text-emerald-400" />}
            <span className="text-[10px] text-white/75 font-medium">{op.region}</span>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-[12px] text-white leading-snug line-clamp-2 group-hover:text-[#00B4FC] transition-colors">
            {op.commercial_name}
          </h3>
          <p className="text-[10px] text-white/35 mt-0.5 line-clamp-1">{op.clase ?? op.operator_type}</p>
        </div>
        <div className="flex items-center justify-between pt-1.5"
          style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-1.5">
            <p className="text-base font-bold leading-none" style={{ color: levelColor(op.level) }}>
              {op.ttdmi_score.toFixed(1)}
            </p>
            <span className="text-[8px] text-white/30 uppercase tracking-widest">TTDMI</span>
          </div>
          <span className="flex items-center gap-0.5 text-[10px] text-[#00B4FC] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Vista tabla ── */
function OperatorTable({ data, page, limit, onRowClick }: { data:any[]; page:number; limit:number; onRowClick:(id:number)=>void }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            <tr>
              {["#","Operador","Dpto.","Nivel","Score"].map((h,i) => (
                <th key={h} className={`px-3 py-2.5 text-left text-[10px] font-semibold text-white/40 ${i===2?"hidden md:table-cell":i===4?"text-right":""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((op,idx) => (
              <tr key={op.id} className="cursor-pointer transition-colors hover:bg-white/[0.04]"
                style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}
                onClick={() => onRowClick(op.id)}>
                <td className="px-3 py-2.5 text-[10px] text-white/30 tabular-nums w-8">{(page-1)*limit+idx+1}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background:"rgba(0,180,252,0.12)", color:"#00B4FC" }}>
                      {initials(op.commercial_name)}
                    </div>
                    <div>
                      <p className="font-medium text-[12px] text-white truncate max-w-[160px]">{op.commercial_name}</p>
                      <p className="text-[10px] text-white/30 font-mono">{op.ruc}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell">
                  <span className="text-[10px] text-white/45 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />{op.region}
                  </span>
                </td>
                <td className="px-3 py-2.5"><LevelBadge level={op.level} /></td>
                <td className="px-3 py-2.5 text-right font-bold tabular-nums text-white text-sm">{op.ttdmi_score.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════ */
export default function DirectorioListaPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [heroImg, setHeroImg] = useState<string>(HEROES[0]!);
  useEffect(() => { setHeroImg(HEROES[Math.floor(Math.random() * HEROES.length)] ?? HEROES[0]!); }, []);
  const [viewMode, setViewMode]       = useState<"cards" | "table">("cards");
  const [search, setSearch]           = useState(searchParams.get("search") ?? "");
  const [debouncedSearch, setDebounced] = useState(searchParams.get("search") ?? "");
  const [region,    setRegion]        = useState("all");
  const [clase,     setClase]         = useState("all");
  const [modalidad, setModalidad]     = useState("all");
  const [level,     setLevel]         = useState("all");
  const [sortBy,    setSortBy]        = useState("diversified");
  const [page,      setPage]          = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const limit = viewMode === "cards" ? 12 : 20;

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, region, clase, modalidad, level, viewMode]);

  const params: Record<string, string | number> = { sort_by: sortBy, page, limit };
  if (debouncedSearch) params.search = debouncedSearch;
  if (region    !== "all") params.region    = region;
  if (clase     !== "all") params.clase     = clase;
  if (modalidad !== "all") params.modalidad = modalidad;
  if (level     !== "all") params.level     = level;

  const { data, isLoading }              = useListOperators(params);
  const { data: summary }                = useAnalyticsSummary();
  const { data: distribution }           = useScoreDistribution();
  const { data: rankings, isLoading: loadingRank } = useGetRankings({ type:"nacional", limit:8 });

  const totalPages   = data ? Math.ceil(data.total / limit) : 1;
  const hasFilters   = !!(search || region!=="all" || clase!=="all" || modalidad!=="all" || level!=="all");
  const clearFilters = () => { setSearch(""); setRegion("all"); setClase("all"); setModalidad("all"); setLevel("all"); setSortBy("ttdmi_score"); setPage(1); };

  const sel: React.CSSProperties = {
    width:"100%", padding:"7px 10px", borderRadius:"10px", fontSize:"12px",
    background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
    color:"white", outline:"none", cursor:"pointer", appearance:"none",
  };

  const kpis = [
    { label:"Operadores", value: summary?.total_operators?.toLocaleString() ?? "–",   icon: Users,       color:"#00B4FC" },
    { label:"Verificados", value: summary?.verified_operators?.toLocaleString() ?? "–", icon: CheckCircle, color:"#34D399" },
    { label:"Score Prom.", value: summary?.avg_ttdmi_score?.toFixed(1) ?? "–",          icon: Award,       color:"#E6C84A" },
    { label:"Elite",       value: summary?.elite_count?.toLocaleString() ?? "–",        icon: TrendingUp,  color:"#E6C84A" },
  ];

  return (
    <div className="min-h-screen" style={{ background:"#0A0A1A" }}>
      <Navbar />

      {/* ══ HERO ══ */}
      <section className="relative flex items-end overflow-hidden" style={{ height:"46vh", minHeight:"320px" }}>
        <div className="absolute inset-0 z-0">
          <Image src={heroImg} alt="Perú" fill sizes="100vw" priority className="object-cover object-center" />
          <div className="absolute inset-0"
            style={{ background:"linear-gradient(to bottom, rgba(10,10,26,0.5) 0%, rgba(10,10,26,0.4) 40%, rgba(10,10,26,0.97) 100%)" }} />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest"
              style={{ background:"rgba(56,189,248,0.15)", border:"1px solid rgba(56,189,248,0.3)", color:"#38bdf8" }}>
              TTDMI · Registro Oficial MINCETUR
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            Directorio Inteligente de{" "}
            <span style={{ color:"#38bdf8" }}>Prestadores Turísticos</span>
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-2xl">
            El índice de confianza digital, reputación y madurez operativa del ecosistema turístico peruano.
          </p>
        </div>
      </section>

      {/* ══ LAYOUT UNIFICADO: sidebar izquierdo + directorio central ══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-5 items-start">

          {/* ────────────────────────────
              SIDEBAR IZQUIERDO — Inicio
          ──────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0 sticky top-6">

            {/* KPIs */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <BarChart3 className="w-3.5 h-3.5 text-[#00B4FC]" />
                <p className="text-xs font-semibold text-white">Estadísticas</p>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {kpis.map((k) => (
                  <div key={k.label} className="rounded-xl p-3 space-y-1 text-center"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <k.icon className="w-4 h-4 mx-auto" style={{ color: k.color }} />
                    <p className="text-lg font-bold text-white tabular-nums">{k.value}</p>
                    <p className="text-[10px] text-white/35 leading-tight">{k.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución TTDMI */}
            {distribution && (
              <div className="rounded-2xl p-4"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs font-semibold text-white mb-3">Distribución TTDMI</p>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={distribution} dataKey="count" innerRadius={35} outerRadius={58} paddingAngle={2}>
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
              </div>
            )}

            {/* Top 8 ranking */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-[#E6C84A]" />
                  <p className="text-xs font-semibold text-white">Top Nacional</p>
                </div>
              </div>
              {loadingRank ? (
                <div className="p-3 space-y-2">
                  {[...Array(5)].map((_, i) => <Sk key={i} className="h-9 w-full" />)}
                </div>
              ) : (
                <div>
                  {rankings?.data.slice(0, 8).map((entry, idx) => (
                    <div key={entry.operator_id}
                      onClick={() => router.push(`/directorio/${entry.operator_id}`)}
                      className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                      style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={idx < 3
                          ? { background:["#E6C84A","#9CA3AF","#CD7F32"][idx], color:"white" }
                          : { background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.4)" }}>
                        {entry.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white truncate">{entry.commercial_name}</p>
                        <p className="text-[9px] text-white/35">{entry.region}</p>
                      </div>
                      <span className="text-[11px] font-bold text-white tabular-nums shrink-0">
                        {entry.ttdmi_score.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </aside>

          {/* ────────────────────────────
              ÁREA CENTRAL — Directorio
          ──────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Barra de búsqueda + controles */}
            <div className="rounded-2xl p-3 space-y-2.5"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>

              {/* Fila: búsqueda + botones */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text"
                    placeholder="Buscar por nombre, RUC, región..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
                    style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
                  {search && (
                    <button onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Toggle vista */}
                <div className="flex items-center rounded-xl p-0.5"
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }}>
                  <button onClick={() => setViewMode("cards")}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                    style={viewMode==="cards" ? { background:"rgba(0,180,252,0.15)", color:"#00B4FC" } : { color:"rgba(255,255,255,0.4)" }}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode("table")}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                    style={viewMode==="table" ? { background:"rgba(0,180,252,0.15)", color:"#00B4FC" } : { color:"rgba(255,255,255,0.4)" }}>
                    <Table2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Filtros toggle */}
                <button onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={showFilters || hasFilters
                    ? { background:"rgba(0,180,252,0.15)", border:"1px solid rgba(0,180,252,0.3)", color:"#00B4FC" }
                    : { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.5)" }}>
                  <Filter className="w-3.5 h-3.5" />
                  Filtros
                  {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#00B4FC]" />}
                </button>
              </div>

              {/* Filtros expandibles */}
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  <select value={region} onChange={(e) => setRegion(e.target.value)} style={sel}>
                    <option value="all">Departamento</option>
                    {REGIONS.map((r) => <option key={r} value={r} style={{ background:"#1E1E4E" }}>{r}</option>)}
                  </select>
                  <select value={clase} onChange={(e) => setClase(e.target.value)} style={sel}>
                    <option value="all">Clase MINCETUR</option>
                    {CLASES.map((c) => <option key={c} value={c} style={{ background:"#1E1E4E" }}>{c}</option>)}
                  </select>
                  <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} style={sel}>
                    <option value="all">Modalidad</option>
                    {MODALIDADES.map((m) => <option key={m} value={m} style={{ background:"#1E1E4E" }}>{m}</option>)}
                  </select>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} style={sel}>
                    <option value="all">Nivel TTDMI</option>
                    {LEVELS.map((l) => <option key={l} value={l} style={{ background:"#1E1E4E" }} className="capitalize">{l}</option>)}
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={sel}>
                    <option value="diversified" style={{ background:"#1E1E4E" }}>Diversificado</option>
                    <option value="ttdmi_score" style={{ background:"#1E1E4E" }}>Score TTDMI</option>
                    <option value="commercial_name" style={{ background:"#1E1E4E" }}>Nombre A-Z</option>
                    <option value="region" style={{ background:"#1E1E4E" }}>Departamento</option>
                  </select>
                  {hasFilters && (
                    <button onClick={clearFilters}
                      className="px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-colors"
                      style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }}>
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}

              {/* Contador */}
              {!isLoading && data && (
                <p className="text-[11px] text-white/30">
                  {(page-1)*limit+1}–{Math.min(page*limit,data.total)} de{" "}
                  <strong className="text-white/50">{data.total.toLocaleString()}</strong> operadores
                  {hasFilters && <span className="text-[#00B4FC] ml-1">· filtrado</span>}
                </p>
              )}
            </div>

            {/* Grid / tabla */}
            {isLoading ? (
              viewMode === "cards" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                      <Sk className="h-32 w-full rounded-none" />
                      <div className="p-3 space-y-2"><Sk className="h-3.5 w-3/4" /><Sk className="h-3 w-1/2" /><Sk className="h-5 w-full" /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex gap-3 px-4 py-3"
                      style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      <Sk className="h-4 w-6" /><Sk className="h-4 w-44" /><Sk className="h-4 w-20" /><Sk className="h-4 w-14 ml-auto" />
                    </div>
                  ))}
                </div>
              )
            ) : !data || data.data.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 font-medium">No se encontraron operadores</p>
                {hasFilters && <button onClick={clearFilters} className="mt-3 text-sm text-[#00B4FC] hover:underline">Limpiar filtros</button>}
              </div>
            ) : (
              <>
                {viewMode === "cards" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {data.data.map((op) => (
                      <OperatorCard key={op.id} op={op} onClick={() => router.push(`/directorio/${op.id}`)} />
                    ))}
                  </div>
                ) : (
                  <OperatorTable data={data.data} page={page} limit={limit} onRowClick={(id) => router.push(`/directorio/${id}`)} />
                )}

                {/* Paginación */}
                {data.total > limit && (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-white/30 tabular-nums">Página {page} / {totalPages}</p>
                    <div className="flex items-center gap-1.5">
                      <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)" }}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const p = page<=3 ? i+1 : page>=totalPages-2 ? totalPages-4+i : page-2+i;
                          if (p<1||p>totalPages) return null;
                          return (
                            <button key={p} onClick={() => setPage(p)}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all"
                              style={p===page
                                ? { background:"rgba(0,180,252,0.2)", border:"1px solid rgba(0,180,252,0.35)", color:"#00B4FC" }
                                : { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)" }}>
                              {p}
                            </button>
                          );
                        })}
                      </div>
                      <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)" }}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
