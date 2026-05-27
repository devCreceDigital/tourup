import { cn } from "@/lib/utils";

function getLevelColor(score: number): string {
  if (score >= 90) return "#D4AF37";
  if (score >= 80) return "#3B82F6";
  if (score >= 70) return "#10B981";
  if (score >= 60) return "#06B6D4";
  if (score >= 40) return "#F97316";
  return "#EF4444";
}

interface Props {
  score: number;
  size?: number;
  showLabel?: boolean;
  label?: string;
}

export default function ScoreGauge({ score, size = 120, showLabel = true, label }: Props) {
  const r = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.09;
  const circumference = 2 * Math.PI * r;
  const arc = (score / 100) * circumference;
  const color = getLevelColor(score);

  return (
    <div className="flex flex-col items-center" data-testid="score-gauge">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div style={{ marginTop: -(size * 0.6), height: size * 0.6 }} className="flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none"
          style={{ fontSize: size * 0.22, color }}
          data-testid="gauge-score-value"
        >
          {score.toFixed(1)}
        </span>
        {showLabel && (
          <span className="text-xs text-muted-foreground mt-0.5">{label ?? "TTDMI"}</span>
        )}
      </div>
    </div>
  );
}

interface BarProps {
  value: number;
  max?: number;
  label: string;
  color?: string;
}

export function ScoreBar({ value, max = 100, label, color }: BarProps) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = color ?? getLevelColor(value);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
