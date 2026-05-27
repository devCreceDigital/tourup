import { useParams, useLocation } from "wouter";
import {
  useGetOperator,
  useGetOperatorScore,
  useRecalculateScore,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import LevelBadge from "@/components/LevelBadge";
import ScoreGauge, { ScoreBar } from "@/components/ScoreGauge";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import {
  ArrowLeft, Globe, Phone, Mail, MapPin, CheckCircle,
  RefreshCw, Users, Star,
} from "lucide-react";
import { SiInstagram, SiFacebook, SiYoutube, SiTiktok } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

const platformIcon: Record<string, React.ElementType> = {
  Instagram: SiInstagram,
  Facebook: SiFacebook,
  YouTube: SiYoutube,
  TikTok: SiTiktok,
  LinkedIn: Globe,
};

const platformColor: Record<string, string> = {
  Instagram: "#E1306C",
  Facebook: "#1877F2",
  YouTube: "#FF0000",
  TikTok: "#000000",
  LinkedIn: "#0A66C2",
};

export default function OperatorDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = parseInt(params.id ?? "0");

  const { data: operator, isLoading } = useGetOperator(id, {
    query: { enabled: !!id },
  });
  const { data: score, refetch: refetchScore } = useGetOperatorScore(id, {
    query: { enabled: !!id },
  });
  const recalc = useRecalculateScore();

  const handleRecalculate = () => {
    recalc.mutate(
      { id },
      {
        onSuccess: () => {
          refetchScore();
          toast({ title: "Score recalculado exitosamente" });
        },
      }
    );
  };

  const radarData = score
    ? [
        { subject: "Reviews", value: score.reviews_score },
        { subject: "Social", value: score.social_score },
        { subject: "Website", value: score.website_score },
        { subject: "SEO", value: score.seo_score },
        { subject: "Engagement", value: score.engagement_score },
        { subject: "Formalidad", value: score.formalidad_score },
        { subject: "Conversión", value: score.conversion_score },
        { subject: "Freshness", value: score.freshness_score },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Operador no encontrado.</p>
        <Button variant="ghost" onClick={() => setLocation("/directorio")} className="mt-3">
          Volver al directorio
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => setLocation("/directorio")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="btn-back"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al directorio
      </button>

      {/* Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Star className="w-8 h-8 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-2">
                <h1 className="text-xl font-bold truncate">{operator.commercial_name}</h1>
                {operator.verified && (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <LevelBadge level={operator.level} size="md" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{operator.legal_name}</p>

              <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {operator.region}{operator.province ? `, ${operator.province}` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {operator.operator_type}
                </span>
                {operator.niche && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{operator.niche}</span>
                )}
                {operator.ruc && (
                  <span className="text-xs font-mono">RUC: {operator.ruc}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-3">
                {operator.website && (
                  <a
                    href={operator.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    data-testid="operator-website"
                  >
                    <Globe className="w-3 h-3" /> {operator.website}
                  </a>
                )}
                {operator.phone && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" /> {operator.phone}
                  </span>
                )}
                {operator.email && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" /> {operator.email}
                  </span>
                )}
              </div>

              {operator.languages && operator.languages.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {operator.languages.map((l) => (
                    <span key={l} className="px-1.5 py-0.5 rounded bg-muted text-xs uppercase font-mono">
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score gauge */}
            <div className="flex flex-col items-center gap-2">
              <ScoreGauge score={operator.ttdmi_score} size={100} />
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleRecalculate}
                disabled={recalc.isPending}
                data-testid="btn-recalculate"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${recalc.isPending ? "animate-spin" : ""}`} />
                Recalcular
              </Button>
            </div>
          </div>

          {operator.description && (
            <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-3">
              {operator.description}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Radar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Análisis TTDMI por Dimensión</CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(1), "Score"]}
                    contentStyle={{ fontSize: 11, borderRadius: 6 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[240px]" />
            )}
          </CardContent>
        </Card>

        {/* Score bars */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Desglose de Subscores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {score ? (
              <>
                <ScoreBar value={score.reviews_score} label="Reviews & Ratings (25%)" />
                <ScoreBar value={score.social_score} label="Social Presence (15%)" />
                <ScoreBar value={score.website_score} label="Website Quality (15%)" />
                <ScoreBar value={score.seo_score} label="SEO Authority (10%)" />
                <ScoreBar value={score.engagement_score} label="Engagement (10%)" />
                <ScoreBar value={score.formalidad_score} label="Formalidad Legal (10%)" />
                <ScoreBar value={score.conversion_score} label="Conversión Digital (10%)" />
                <ScoreBar value={score.freshness_score} label="Freshness (5%)" />
                <div className="pt-1 border-t border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Validation Factor</span>
                    <span className="font-semibold">{score.validation_factor.toFixed(3)}x</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-6" />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Social profiles */}
        {operator.social_profiles && operator.social_profiles.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Presencia en Redes Sociales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {operator.social_profiles.map((sp) => {
                const Icon = platformIcon[sp.platform] ?? Globe;
                const color = platformColor[sp.platform] ?? "hsl(var(--primary))";
                return (
                  <div key={sp.id} className="flex items-center gap-3" data-testid={`social-${sp.platform}`}>
                    <Icon style={{ color }} className="w-4 h-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{sp.platform} {sp.handle && `@${sp.handle}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {sp.followers.toLocaleString()} seguidores · {sp.engagement_rate.toFixed(1)}% engagement
                      </p>
                    </div>
                    {sp.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Booking capabilities */}
        {operator.booking_capabilities && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Capacidades de Conversión Digital</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "booking_engine", label: "Booking Engine" },
                  { key: "online_payment", label: "Pago Online" },
                  { key: "whatsapp_cta", label: "WhatsApp CTA" },
                  { key: "chatbot", label: "Chatbot" },
                  { key: "lead_form", label: "Lead Form" },
                ].map((cap) => {
                  const active = (operator.booking_capabilities as Record<string, boolean>)[cap.key];
                  return (
                    <div
                      key={cap.key}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs border ${
                        active
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "border-border text-muted-foreground"
                      }`}
                      data-testid={`capability-${cap.key}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${active ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                      />
                      {cap.label}
                    </div>
                  );
                })}
              </div>
              {operator.booking_capabilities.response_time_hours !== null && (
                <p className="text-xs text-muted-foreground mt-3">
                  Tiempo de respuesta promedio: <strong>{operator.booking_capabilities.response_time_hours}h</strong>
                </p>
              )}
              {operator.booking_capabilities.ota_presence && operator.booking_capabilities.ota_presence.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1.5">Presencia en OTAs:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {operator.booking_capabilities.ota_presence.map((ota) => (
                      <span key={ota} className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs">
                        {ota}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reviews summary */}
      {operator.reviews_summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumen de Reputación Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{operator.reviews_summary.average_rating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Rating Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{operator.reviews_summary.total_reviews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{(operator.reviews_summary.authenticity_score * 100).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Autenticidad</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{(operator.reviews_summary.sentiment_score * 100).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Sentimiento</p>
              </div>
            </div>
            {operator.reviews_summary.sources && (
              <div className="flex flex-wrap gap-2">
                {operator.reviews_summary.sources.map((src) => (
                  <div key={src.source} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs">
                    <span className="font-medium">{src.source}</span>
                    <span className="text-muted-foreground">·</span>
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>{src.avg_rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({src.count.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {operator.certifications && operator.certifications.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Certificaciones y Licencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {operator.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 text-xs"
                  data-testid={`cert-${cert.id}`}
                >
                  {cert.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                  <span className="font-medium text-emerald-800 dark:text-emerald-300">{cert.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{cert.issuer}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
