import { useState } from "react";
import { useLocation } from "wouter";
import { useGetRankings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import LevelBadge from "@/components/LevelBadge";
import {
  Trophy, TrendingUp, TrendingDown, Minus,
  Star, Globe, Zap, RefreshCw, MapPin, Eye,
} from "lucide-react";

const RANKING_TYPES = [
  { value: "nacional", label: "Nacional", icon: Trophy },
  { value: "trust", label: "Trust Score", icon: Star },
  { value: "conversion", label: "Conversión", icon: Zap },
  { value: "seo", label: "SEO", icon: Globe },
  { value: "freshness", label: "Freshness", icon: RefreshCw },
  { value: "hidden_gems", label: "Hidden Gems", icon: Eye },
] as const;

type RankingType = typeof RANKING_TYPES[number]["value"];

function RankChange({ change }: { change: number | null }) {
  if (change === null || change === 0) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
      <TrendingUp className="w-3 h-3" />+{change}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium">
      <TrendingDown className="w-3 h-3" />{change}
    </span>
  );
}

function RankingList({ type }: { type: RankingType }) {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetRankings({ type, limit: 20 });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {data?.data.map((entry, idx) => (
        <div
          key={entry.operator_id}
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors"
          onClick={() => setLocation(`/operadores/${entry.operator_id}`)}
          data-testid={`ranking-entry-${entry.operator_id}`}
        >
          {/* Rank */}
          <div className="w-10 shrink-0 text-center">
            {idx < 3 ? (
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                style={{
                  background: idx === 0 ? "#D4AF37" : idx === 1 ? "#9CA3AF" : "#CD7F32",
                  color: "white",
                }}
              >
                {entry.rank}
              </span>
            ) : (
              <span className="text-sm font-bold text-muted-foreground tabular-nums">
                {entry.rank}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{entry.commercial_name}</p>
              {entry.verified && (
                <span className="shrink-0 text-xs text-emerald-600 font-medium">✓</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {entry.region} · {entry.operator_type}
              {entry.niche && ` · ${entry.niche}`}
            </p>
          </div>

          {/* Level & Score */}
          <div className="flex items-center gap-3 shrink-0">
            <RankChange change={entry.rank_change} />
            <LevelBadge level={entry.level} />
            <div className="text-right">
              <p className="font-bold tabular-nums text-sm">{entry.ttdmi_score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">TTDMI</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<RankingType>("nacional");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Rankings del Sistema</h1>
        <p className="text-sm text-muted-foreground">
          Clasificaciones dinámicas del ecosistema turístico peruano
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RankingType)}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted p-1">
          {RANKING_TYPES.map((rt) => (
            <TabsTrigger
              key={rt.value}
              value={rt.value}
              className="flex items-center gap-1.5 text-xs"
              data-testid={`tab-ranking-${rt.value}`}
            >
              <rt.icon className="w-3 h-3" />
              {rt.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {RANKING_TYPES.map((rt) => (
          <TabsContent key={rt.value} value={rt.value}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <rt.icon className="w-4 h-4 text-primary" />
                  Ranking por {rt.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RankingList type={rt.value} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
