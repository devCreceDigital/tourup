import {
  useGetAnalyticsSummary,
  useGetScoreDistribution,
  useGetRegionStats,
  useGetNicheStats,
  useGetHiddenGems,
  useGetDigitalGaps,
  useGetScoreTrend,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import LevelBadge from "@/components/LevelBadge";
import { useLocation } from "wouter";
import { TrendingUp, Eye, AlertCircle, MapPin } from "lucide-react";

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const { data: summary } = useGetAnalyticsSummary();
  const { data: distribution } = useGetScoreDistribution();
  const { data: regions } = useGetRegionStats();
  const { data: niches } = useGetNicheStats();
  const { data: hiddenGems } = useGetHiddenGems({ limit: 6 });
  const { data: digitalGaps } = useGetDigitalGaps({ limit: 6 });
  const { data: trend } = useGetScoreTrend();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Intelligence</h1>
        <p className="text-sm text-muted-foreground">
          Análisis del ecosistema turístico peruano
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Score Promedio", value: summary?.avg_ttdmi_score?.toFixed(1) ?? "–", sub: "TTDMI Nacional" },
          { label: "Operadores Elite", value: summary?.elite_count ?? "–", sub: "Score ≥ 90" },
          { label: "Digital Gaps", value: summary?.digital_gap_operators ?? "–", sub: "Oportunidades" },
          { label: "Hidden Gems", value: summary?.hidden_gems_count ?? "–", sub: "Alto potencial" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-3xl font-bold tabular-nums mt-1">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Score trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolución Score Promedio 2026</CardTitle>
          </CardHeader>
          <CardContent>
            {trend ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trend} margin={{ left: -10, right: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  <Line
                    type="monotone"
                    dataKey="avg_score"
                    name="Score Prom."
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[200px]" />
            )}
          </CardContent>
        </Card>

        {/* Distribution pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución por Nivel</CardTitle>
          </CardHeader>
          <CardContent>
            {distribution ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="count"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {distribution.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [v, n]}
                      contentStyle={{ fontSize: 11, borderRadius: 6 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {distribution.map((d) => (
                    <div key={d.level} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{d.count}</span>
                        <span className="text-muted-foreground">({d.avg_score.toFixed(0)} avg)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Skeleton className="h-[160px]" />
            )}
          </CardContent>
        </Card>

        {/* Regions bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Operadores por Región</CardTitle>
          </CardHeader>
          <CardContent>
            {regions ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={regions} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="region" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name="Operadores" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="elite_count" name="Elite" fill="#D4AF37" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[220px]" />
            )}
          </CardContent>
        </Card>

        {/* Niches */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score Promedio por Nicho</CardTitle>
          </CardHeader>
          <CardContent>
            {niches ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={niches} layout="vertical" margin={{ left: -10, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="niche"
                    tick={{ fontSize: 9 }}
                    width={110}
                  />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  <Bar dataKey="avg_score" name="Score" fill="hsl(var(--chart-3))" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[220px]" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden Gems */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-600" />
            Hidden Gems — Alto Potencial Subvalorado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hiddenGems ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hiddenGems.map((gem) => (
                <div
                  key={gem.operator_id}
                  className="rounded-lg border border-border p-3 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/operadores/${gem.operator_id}`)}
                  data-testid={`hidden-gem-${gem.operator_id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{gem.commercial_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{gem.region}
                      </p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{gem.insight}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs">Score actual: <strong>{gem.ttdmi_score.toFixed(1)}</strong></span>
                    <span className="text-xs text-cyan-600">Potencial: <strong>{gem.potential_score.toFixed(1)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital Gaps */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Digital Gaps — Reputación Alta, Digitalización Baja
          </CardTitle>
        </CardHeader>
        <CardContent>
          {digitalGaps ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {digitalGaps.map((op) => (
                <div
                  key={op.operator_id}
                  className="rounded-lg border border-orange-200 dark:border-orange-900 p-3 hover:bg-orange-50 dark:hover:bg-orange-950/20 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/operadores/${op.operator_id}`)}
                  data-testid={`digital-gap-${op.operator_id}`}
                >
                  <p className="font-medium text-sm truncate">{op.commercial_name}</p>
                  <p className="text-xs text-muted-foreground">{op.region} · {op.operator_type}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">{op.recommendation}</p>
                  <div className="flex justify-between mt-1.5 text-xs">
                    <span>Gap: <strong>{op.gap}</strong> pts</span>
                    <span>Score: <strong>{op.digital_score.toFixed(1)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
