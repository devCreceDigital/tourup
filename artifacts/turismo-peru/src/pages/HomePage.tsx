import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGetAnalyticsSummary,
  useGetRankings,
  useGetScoreDistribution,
  useGetRegionStats,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LevelBadge from "@/components/LevelBadge";
import ScoreGauge from "@/components/ScoreGauge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Search, CheckCircle, MapPin, TrendingUp, Award, Users, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary();
  const { data: rankings, isLoading: loadingRankings } = useGetRankings({
    type: "nacional",
    limit: 10,
  });
  const { data: distribution } = useGetScoreDistribution();
  const { data: regions } = useGetRegionStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/directorio?search=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/directorio");
    }
  };

  const statCards = [
    {
      label: "Operadores Registrados",
      value: summary?.total_operators ?? 0,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Operadores Verificados",
      value: summary?.verified_operators ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600",
    },
    {
      label: "Score Promedio TTDMI",
      value: summary?.avg_ttdmi_score?.toFixed(1) ?? "–",
      icon: Award,
      color: "text-yellow-600",
    },
    {
      label: "Regiones Cubiertas",
      value: summary?.regions_covered ?? 0,
      icon: MapPin,
      color: "text-blue-600",
    },
    {
      label: "Operadores Elite",
      value: summary?.elite_count ?? 0,
      icon: TrendingUp,
      color: "text-yellow-500",
    },
    {
      label: "Hidden Gems",
      value: summary?.hidden_gems_count ?? 0,
      icon: Globe,
      color: "text-cyan-600",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Award className="w-3.5 h-3.5" />
          Tourism Trust &amp; Digital Maturity Index
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Directorio Inteligente de<br />
          <span className="text-primary">Prestadores Turísticos</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          El índice de confianza digital, reputación y madurez operativa del ecosistema turístico peruano.
        </p>
        <form onSubmit={handleSearch} className="flex max-w-xl mx-auto gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar operador, región, tipo..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input-hero"
            />
          </div>
          <Button type="submit" data-testid="search-btn-hero">Buscar</Button>
        </form>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="p-4 space-y-1">
              <stat.icon className={`w-5 h-5 mx-auto ${stat.color}`} />
              {loadingSummary ? (
                <Skeleton className="h-7 w-12 mx-auto" />
              ) : (
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top 10 Nacional */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Ranking Nacional Top 10</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/rankings")} data-testid="btn-ver-rankings">
                Ver todos
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRankings ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {rankings?.data.slice(0, 10).map((entry) => (
                    <div
                      key={entry.operator_id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/operadores/${entry.operator_id}`)}
                      data-testid={`ranking-row-${entry.operator_id}`}
                    >
                      <span className="w-7 h-7 flex items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums shrink-0">
                        {entry.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.commercial_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.region} · {entry.operator_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <LevelBadge level={entry.level} />
                        <span className="text-sm font-bold tabular-nums w-10 text-right">
                          {entry.ttdmi_score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Distribución de niveles */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribución TTDMI</CardTitle>
            </CardHeader>
            <CardContent>
              {distribution ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {distribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [v, n]}
                      contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-[180px] w-full" />
              )}
              <div className="mt-2 space-y-1">
                {distribution?.map((d) => (
                  <div key={d.level} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.label}</span>
                    </div>
                    <span className="font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top regiones */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Regiones</CardTitle>
            </CardHeader>
            <CardContent>
              {regions ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={regions.slice(0, 6)}
                    layout="vertical"
                    margin={{ left: -10, right: 10 }}
                  >
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="region"
                      tick={{ fontSize: 10 }}
                      width={55}
                    />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                    <Bar dataKey="avg_score" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-[160px] w-full" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Niveles explicados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sistema de Clasificación TTDMI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { level: "elite", score: "90–100", desc: "World-Class Operator" },
              { level: "premium", score: "80–89", desc: "High Trust" },
              { level: "advanced", score: "70–79", desc: "Digitally Mature" },
              { level: "growing", score: "60–69", desc: "Mid Maturity" },
              { level: "emerging", score: "40–59", desc: "Low Digitalization" },
              { level: "risk", score: "0–39", desc: "Weak Trust" },
            ].map((l) => (
              <div key={l.level} className="text-center space-y-1.5">
                <LevelBadge level={l.level} size="md" />
                <p className="text-xs font-mono font-semibold text-muted-foreground">{l.score}</p>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
