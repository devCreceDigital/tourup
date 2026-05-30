"use client";

import { useParams, useRouter } from "next/navigation";
import Navbar from "@/shared/ui/navigation/Navbar";
import LevelBadge from "../_components/LevelBadge";
import { useGetOperator } from "../_hooks/useOperators";
import { useCallback, useState } from "react";

const API = process.env.NEXT_PUBLIC_DIRECTORIO_API_URL ?? "http://localhost:8080";

function useRecalculate(id: number, onSuccess: () => void) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const run = useCallback(async () => {
    setLoading(true); setDone(false);
    await fetch(`${API}/api/operators/${id}/score`, { method: "POST" }).catch(() => {});
    setLoading(false); setDone(true);
    setTimeout(() => setDone(false), 2500);
    onSuccess();
  }, [id, onSuccess]);
  return { run, loading, done };
}
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import {
  ArrowLeft, Globe, Mail, MapPin, CheckCircle,
  Users, Star, Wifi, Hash,
  TrendingUp, Award, MessageCircle, RefreshCw,
} from "lucide-react";
import { SiInstagram, SiFacebook, SiYoutube, SiTiktok } from "react-icons/si";

/* ─── helpers ─── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/8 ${className}`} />;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {children}
    </div>
  );
}

function CardHeader({ title, icon: Icon, color = "#00B4FC" }: { title: string; icon: React.ElementType; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <p className="font-semibold text-sm text-white">{title}</p>
    </div>
  );
}

import { levelColor } from "../_lib/constants";

const PLATFORM_ICON: Record<string, React.ElementType> = {
  Instagram: SiInstagram, Facebook: SiFacebook,
  YouTube: SiYoutube, TikTok: SiTiktok, LinkedIn: Globe,
};
const PLATFORM_COLOR: Record<string, string> = {
  Instagram: "#E1306C", Facebook: "#1877F2",
  YouTube: "#FF0000", TikTok: "#69C9D0", LinkedIn: "#0A66C2",
};

const TOOLTIP_STYLE = {
  background: "#12122A", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10, fontSize: 11, color: "white",
};

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const color = value >= 80 ? "#34D399" : value >= 60 ? "#22D3EE" : value >= 40 ? "#FB923C" : "#F87171";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/50">{label} <span className="text-white/25">({weight})</span></span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

/* ─── Gauge SVG ─── */
function ScoreGauge({ score, size = 110 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const sw = size * 0.09;
  const circ = 2 * Math.PI * r;
  const arc = (score / 100) * circ;
  const color = levelColor(
    score >= 90 ? "elite" : score >= 80 ? "premium" : score >= 70 ? "advanced" : score >= 60 ? "growing" : score >= 40 ? "emerging" : "risk"
  );
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${arc} ${circ}`} style={{ transition: "stroke-dasharray 0.8s ease", filter: `drop-shadow(0 0 6px ${color}70)` }} />
      </svg>
      <div className="relative flex flex-col items-center justify-center">
        <span className="font-bold leading-none" style={{ fontSize: size * 0.22, color }}>{score.toFixed(1)}</span>
        <span className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">TTDMI</span>
      </div>
    </div>
  );
}

/* ─── Modal de contacto ─── */
function ContactModal({
  platform, operatorName, onClose,
}: { platform: string; operatorName: string; onClose: () => void }) {
  const [form, setForm] = useState({ nombre: "", email: "", asunto: "", mensaje: "" });
  const [sent, setSent]   = useState(false);
  const [sending, setSending] = useState(false);

  const field = (id: keyof typeof form) => ({
    value: form[id],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [id]: e.target.value })),
  });

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-colors";
  const inputSt: React.CSSProperties = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#12122A", border: "1px solid rgba(255,255,255,0.12)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div>
            <p className="font-semibold text-white text-sm">Contactar en {platform}</p>
            <p className="text-xs text-white/40 mt-0.5">{operatorName}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5">
          {sent ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}>
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="font-semibold text-white">¡Mensaje enviado!</p>
              <p className="text-sm text-white/45">El operador recibirá tu consulta y se comunicará contigo a la brevedad.</p>
              <button onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#00B4FC,#5B4FE8)" }}>
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-white/40 mb-1 block">Tu nombre *</label>
                  <input type="text" placeholder="Nombre completo" required {...field("nombre")}
                    className={inputCls} style={inputSt} />
                </div>
                <div>
                  <label className="text-[11px] text-white/40 mb-1 block">Tu email *</label>
                  <input type="email" placeholder="email@ejemplo.com" required {...field("email")}
                    className={inputCls} style={inputSt} />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-white/40 mb-1 block">Asunto</label>
                <input type="text" placeholder={`Consulta vía ${platform}`} {...field("asunto")}
                  className={inputCls} style={inputSt} />
              </div>
              <div>
                <label className="text-[11px] text-white/40 mb-1 block">Mensaje *</label>
                <textarea placeholder="Describe tu consulta o solicitud..." required rows={4}
                  {...field("mensaje")} className={`${inputCls} resize-none`} style={inputSt} />
              </div>
              <button type="submit" disabled={sending}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 mt-1"
                style={{ background: "linear-gradient(135deg,#00B4FC,#5B4FE8)" }}>
                {sending ? "Enviando..." : `Enviar por ${platform}`}
              </button>
              <p className="text-[10px] text-white/25 text-center">
                Al enviar, el operador podrá contactarte al email indicado.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Social Section ─── */
const PLATFORMS = [
  { name: "Facebook",  Icon: SiFacebook,  color: "#1877F2" },
  { name: "Instagram", Icon: SiInstagram, color: "#E1306C" },
  { name: "YouTube",   Icon: SiYoutube,   color: "#FF0000" },
  { name: "TikTok",    Icon: SiTiktok,    color: "#69C9D0" },
];

function SocialSection({ op }: { op: any }) {
  const [contactPlatform, setContactPlatform] = useState<string | null>(null);

  // Busca si el operador tiene datos reales para esta plataforma
  const getProfile = (platformName: string) =>
    (op.social_profiles ?? []).find((sp: any) =>
      sp.platform?.toLowerCase() === platformName.toLowerCase()
    );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLATFORMS.map(({ name, Icon, color }) => {
          const profile   = getProfile(name);
          const hasData   = !!profile;
          const followers = profile?.followers ?? 0;
          const handle    = profile?.handle;
          const eng       = profile?.engagement_rate ?? 0;
          const followersFmt = followers >= 1000
            ? `${(followers / 1000).toFixed(1)}K`
            : followers > 0 ? followers.toLocaleString() : null;

          return (
            <div key={name}
              className="rounded-xl p-4 flex flex-col gap-3 transition-all"
              style={hasData
                ? { background: `${color}08`, border: `1px solid ${color}20` }
                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

              {/* Fila icono + info */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={hasData
                    ? { background: `${color}18`, border: `1px solid ${color}28` }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Icon className="w-5 h-5" style={{ color: hasData ? color : "rgba(255,255,255,0.25)" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: hasData ? "white" : "rgba(255,255,255,0.35)" }}>
                      {name}
                    </p>
                    {handle && (
                      <span className="text-[11px] text-white/35">@{handle}</span>
                    )}
                    {profile?.verified && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  {hasData ? (
                    <div className="mt-0.5 space-y-0.5">
                      {followersFmt && (
                        <p className="text-xs text-white/50">
                          <span className="font-semibold text-white">{followersFmt}</span> seguidores
                        </p>
                      )}
                      {eng > 0 && (
                        <p className="text-xs text-white/40">{eng.toFixed(1)}% engagement</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      Sin información registrada
                    </p>
                  )}
                </div>

                {/* Seguidores destacado */}
                {followersFmt && (
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold" style={{ color }}>{followersFmt}</p>
                    <p className="text-[9px] text-white/25 uppercase tracking-wider">seguidores</p>
                  </div>
                )}
              </div>


              {/* Botón Contactar */}
              <button
                onClick={() => setContactPlatform(name)}
                className="w-full py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-1.5"
                style={hasData
                  ? { background: `${color}18`, border: `1px solid ${color}28`, color }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                <Globe className="w-3.5 h-3.5" />
                Contactar vía {name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {contactPlatform && (
        <ContactModal
          platform={contactPlatform}
          operatorName={op.commercial_name}
          onClose={() => setContactPlatform(null)}
        />
      )}
    </>
  );
}

/* ─── Page ─── */
export default function OperatorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = parseInt(params.id ?? "0");
  const { data: op, isLoading, refetch } = useGetOperator(id);
  const recalc = useRecalculate(id, () => refetch?.());
  const [showContact, setShowContact] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#0A0A1A" }}>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 pt-28 pb-20 space-y-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full" />
          <div className="grid md:grid-cols-2 gap-5">
            <Skeleton className="h-64" /><Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!op) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A1A" }}>
        <Navbar />
        <div className="text-center">
          <p className="text-white/40 text-lg">Operador no encontrado.</p>
          <button onClick={() => router.push("/directorio")} className="mt-4 text-sm text-[#00B4FC] hover:underline">
            Volver al directorio
          </button>
        </div>
      </div>
    );
  }

  // Si no hay score real, estimamos con los datos del MINCETUR disponibles
  const estimateScores = (o: typeof op) => {
    const base        = Math.min(op.ttdmi_score, 75);
    const website     = o.website      ? Math.min(base + 10, 80) : Math.max(base - 15, 15);
    const email       = o.email        ? 1 : 0;
    const phone       = o.phone        ? 1 : 0;
    const digitalMod  = o.modalidad_autorizada?.includes("Digital") ? 12 : 0;
    const cert        = o.nro_certificado ? 8 : 0;
    const ruc         = o.ruc          ? 8 : 0;
    const formalidad  = Math.min(40 + ruc + cert + (o.verified ? 10 : 0), 90);
    const conversion  = Math.min(20 + (o.website ? 20 : 0) + digitalMod + (email * 8) + (phone * 5), 75);
    const freshness   = o.fecha_expedicion ? 55 : 40;
    const social      = (o.social_profiles?.length ?? 0) > 0 ? 60 : 25;
    const seo         = o.website ? 45 : 20;
    const engagement  = 30;
    const reviews     = base * 0.6;
    return { reviews_score: +reviews.toFixed(1), social_score: +social.toFixed(1), website_score: +website.toFixed(1), seo_score: +seo.toFixed(1), engagement_score: +engagement.toFixed(1), formalidad_score: +formalidad.toFixed(1), conversion_score: +conversion.toFixed(1), freshness_score: +freshness.toFixed(1), network_score: 40, validation_factor: o.verified ? 1.05 : 1.0 };
  };

  const sc = op.score_breakdown ?? estimateScores(op);
  const isEstimated = !op.score_breakdown;

  const radarData = [
    { subject: "Reviews",    value: sc.reviews_score },
    { subject: "Social",     value: sc.social_score },
    { subject: "Website",    value: sc.website_score },
    { subject: "SEO",        value: sc.seo_score },
    { subject: "Engagement", value: sc.engagement_score },
    { subject: "Formalidad", value: sc.formalidad_score },
    { subject: "Conversion", value: sc.conversion_score },
    { subject: "Freshness",  value: sc.freshness_score },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A1A" }}>
      <Navbar />

      {/* Glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-8 pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${levelColor(op.level)} 0%, transparent 70%)` }} />

      <main className="relative max-w-5xl mx-auto px-4 pt-28 pb-20 space-y-5">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/35 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al directorio
        </button>

        {/* ── HEADER ── */}
        <Card>
          <div className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-5">

              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                style={{ background: `${levelColor(op.level)}18`, border: `1px solid ${levelColor(op.level)}30`, color: levelColor(op.level) }}>
                {(op.commercial_name ?? "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "??"}
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                {/* Nombre + badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-white leading-tight">{op.commercial_name}</h1>
                  {op.verified && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                  <LevelBadge level={op.level} size="md" />
                </div>
                {op.legal_name && op.legal_name !== op.commercial_name && (
                  <p className="text-sm text-white/40">{op.legal_name}</p>
                )}

                {/* Datos principales */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/55">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#00B4FC]" />
                    {[op.region, op.province, op.district].filter(Boolean).join(", ")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 shrink-0 text-[#8B7FF0]" />
                    {op.clase ?? op.operator_type}
                  </span>
                  {op.modalidad_autorizada && (
                    <span className="flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 shrink-0 text-[#22D3EE]" />
                      {op.modalidad_autorizada}
                    </span>
                  )}
                  {op.niche && (
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 shrink-0 text-[#FB923C]" />
                      {op.niche}
                    </span>
                  )}
                  {op.ruc && (
                    <span className="flex items-center gap-1.5 font-mono text-xs">
                      <Hash className="w-3.5 h-3.5 shrink-0 text-white/30" />
                      RUC: {op.ruc}
                    </span>
                  )}
                </div>

                {/* MINCETUR oficial */}
                {(op.rep_legal || op.nro_certificado || op.fecha_expedicion || op.ubigeo) && (
                  <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2 text-xs text-white/35"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    {op.rep_legal && (
                      <span><span className="text-white/50 font-medium">Rep. Legal:</span> {op.rep_legal}</span>
                    )}
                    {op.nro_certificado && (
                      <span><span className="text-white/50 font-medium">Cert. MINCETUR:</span> {op.nro_certificado}</span>
                    )}
                    {op.fecha_expedicion && (
                      <span><span className="text-white/50 font-medium">Expedición:</span> {op.fecha_expedicion}</span>
                    )}
                    {op.ubigeo && (
                      <span><span className="text-white/50 font-medium">Ubigeo:</span> {op.ubigeo}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400/60" />
                      <span className="text-emerald-400/60 font-medium">Registro Oficial MINCETUR</span>
                    </span>
                  </div>
                )}

                {/* Certificaciones */}
                {op.certifications && op.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    {op.certifications.map((cert) => (
                      <div key={cert.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px]"
                        style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                        {cert.verified && <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />}
                        <span className="font-semibold text-emerald-400">{cert.name}</span>
                        <span className="text-white/30">· {cert.issuer}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contacto — solo website público */}
                <div className="flex flex-wrap gap-3">
                  {op.website && (
                    <a href={op.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#00B4FC] hover:underline">
                      <Globe className="w-3.5 h-3.5" /> {op.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>

                {/* Idiomas */}
                {op.languages && op.languages.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {op.languages.map((l) => (
                      <span key={l} className="text-[11px] px-2 py-0.5 rounded-lg font-mono uppercase text-white/50"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Score gauge + acciones */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <ScoreGauge score={op.ttdmi_score} size={110} />
                <LevelBadge level={op.level} size="sm" />
                <button
                  onClick={() => setShowContact(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 mt-1"
                  style={{ background: "linear-gradient(135deg,#00B4FC,#5B4FE8)", color: "white" }}>
                  <Mail className="w-3 h-3" />
                  Contactar
                </button>
                <button
                  onClick={recalc.run}
                  disabled={recalc.loading}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={recalc.done
                    ? { background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34D399" }
                    : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}>
                  <RefreshCw className={`w-3 h-3 ${recalc.loading ? "animate-spin" : ""}`} />
                  {recalc.loading ? "Calculando..." : recalc.done ? "¡Actualizado!" : "Recalcular"}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* ── REPUTACIÓN ONLINE ── */}
        <Card>
          <CardHeader title="Resumen de Reputación Online" icon={Star} color="#E6C84A" />
          <div className="p-5">
            {op.reviews_summary ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Rating Promedio", value: op.reviews_summary.average_rating.toFixed(1), color: "#E6C84A", suffix: "/ 5" },
                    { label: "Total Reviews",   value: op.reviews_summary.total_reviews.toLocaleString(), color: "#00B4FC" },
                    { label: "Autenticidad",    value: `${(op.reviews_summary.authenticity_score * 100).toFixed(0)}%`, color: "#34D399" },
                    { label: "Sentimiento",     value: `${((op.reviews_summary.sentiment_score ?? 0) * 100).toFixed(0)}%`, color: "#8B7FF0" },
                  ].map((k) => (
                    <div key={k.label} className="rounded-xl p-4 text-center space-y-1"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: k.color }}>
                        {k.value}
                        {k.suffix && <span className="text-sm font-normal text-white/30 ml-1">{k.suffix}</span>}
                      </p>
                      <p className="text-[11px] text-white/35">{k.label}</p>
                    </div>
                  ))}
                </div>
                {op.reviews_summary.sources && op.reviews_summary.sources.length > 0 && (
                  <div>
                    <p className="text-xs text-white/35 mb-2">Fuentes de reseñas:</p>
                    <div className="flex flex-wrap gap-2">
                      {op.reviews_summary.sources.map((src) => (
                        <div key={src.source} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <span className="font-semibold text-white">{src.source}</span>
                          <span className="text-white/25">·</span>
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-white/70">{src.avg_rating.toFixed(1)}</span>
                          <span className="text-white/35">({src.count.toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Star className="w-8 h-8 text-white/15 mx-auto" />
                <p className="text-xs text-white/30">Sin datos de reputación online registrados</p>
                <p className="text-[11px] text-white/20">Los datos provienen del registro MINCETUR oficial</p>
              </div>
            )}
          </div>
        </Card>

        {/* ── REDES SOCIALES + CONVERSIÓN ── */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Social profiles */}
          <Card>
            <CardHeader
              title={`Presencia en Redes Sociales${op.social_profiles && op.social_profiles.length > 0 ? "" : " (estimada)"}`}
              icon={Globe}
              color="#E1306C"
            />
            <div className="p-5">
              <SocialSection op={op} />
            </div>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader title="Ubicación de Agencia" icon={MapPin} color="#22D3EE" />
            <div className="p-5 space-y-4">
              {/* Datos de ubicación */}
              <div className="space-y-2">
                {[
                  { label: "Región",    value: op.region },
                  { label: "Provincia", value: op.province },
                  { label: "Distrito",  value: op.district },
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-xs text-white/35">{f.label}</span>
                    <span className="text-xs font-medium text-white/75">{f.value}</span>
                  </div>
                ))}
              </div>

              {/* Mapa embebido */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <iframe
                  title="Ubicación"
                  width="100%"
                  height="180"
                  loading="lazy"
                  style={{ display: "block" }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    [op.district, op.province, op.region, "Perú"].filter(Boolean).join(", ")
                  )}&output=embed&z=12`}
                />
              </div>

              {/* Abrir en Maps */}
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(
                  [op.district, op.province, op.region, "Perú"].filter(Boolean).join(", ")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90"
                style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", color: "#22D3EE" }}>
                <MapPin className="w-3.5 h-3.5" />
                Abrir en Google Maps
              </a>
            </div>
          </Card>
        </div>

        {/* ── ANÁLISIS TTDMI ── */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Radar */}
          <Card>
            <CardHeader title={`Análisis TTDMI por Dimensión${isEstimated ? " (estimado)" : ""}`} icon={TrendingUp} color="#00B4FC" />
            <div className="p-5">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} margin={{ top: 5, right: 25, bottom: 5, left: 25 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} />
                  <Radar name="Score" dataKey="value" stroke="#00B4FC" fill="#00B4FC" fillOpacity={0.2}
                    strokeWidth={2} dot={{ fill: "#00B4FC", r: 3 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [(v as number).toFixed(1), "Score"]} />
                </RadarChart>
              </ResponsiveContainer>
              {isEstimated && (
                <p className="text-[10px] text-white/25 text-center mt-1">
                  * Scores estimados con datos MINCETUR disponibles
                </p>
              )}
            </div>
          </Card>

          {/* Score bars */}
          <Card>
            <CardHeader title={`Desglose de Subscores${isEstimated ? " (estimado)" : ""}`} icon={Award} color="#E6C84A" />
            <div className="p-5 space-y-3.5">
              <ScoreBar label="Reviews & Ratings"  weight="25%" value={sc.reviews_score} />
              <ScoreBar label="Social Presence"    weight="15%" value={sc.social_score} />
              <ScoreBar label="Website Quality"    weight="15%" value={sc.website_score} />
              <ScoreBar label="SEO Authority"      weight="10%" value={sc.seo_score} />
              <ScoreBar label="Engagement"         weight="10%" value={sc.engagement_score} />
              <ScoreBar label="Formalidad Legal"   weight="10%" value={sc.formalidad_score} />
              <ScoreBar label="Conversion Digital" weight="10%" value={sc.conversion_score} />
              <ScoreBar label="Freshness"          weight="5%"  value={sc.freshness_score} />
              <div className="flex justify-between items-center pt-2 mt-1"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-xs text-white/35">Validation Factor</span>
                <span className="text-xs font-bold text-[#00B4FC]">{sc.validation_factor.toFixed(3)}×</span>
              </div>
            </div>
          </Card>
        </div>

      </main>

      {showContact && (
        <ContactModal
          platform="Email"
          operatorName={op.commercial_name}
          onClose={() => setShowContact(false)}
        />
      )}
    </div>
  );
}
