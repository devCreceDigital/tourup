import { cn } from "@/lib/utils";

const LEVELS: Record<string, { label: string; className: string }> = {
  elite: { label: "Elite", className: "bg-yellow-400/20 text-yellow-700 border-yellow-400/40 dark:text-yellow-300" },
  premium: { label: "Premium", className: "bg-blue-500/20 text-blue-700 border-blue-500/40 dark:text-blue-300" },
  advanced: { label: "Advanced", className: "bg-emerald-500/20 text-emerald-700 border-emerald-500/40 dark:text-emerald-300" },
  growing: { label: "Growing", className: "bg-cyan-500/20 text-cyan-700 border-cyan-500/40 dark:text-cyan-300" },
  emerging: { label: "Emerging", className: "bg-orange-500/20 text-orange-700 border-orange-500/40 dark:text-orange-300" },
  risk: { label: "Risk", className: "bg-red-500/20 text-red-700 border-red-500/40 dark:text-red-300" },
};

interface Props {
  level: string;
  size?: "sm" | "md" | "lg";
}

export default function LevelBadge({ level, size = "sm" }: Props) {
  const cfg = LEVELS[level] ?? LEVELS.risk;
  return (
    <span
      className={cn(
        "inline-flex items-center border rounded-full font-semibold tracking-wide",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        size === "lg" && "px-4 py-1.5 text-base",
        cfg.className
      )}
      data-testid={`badge-level-${level}`}
    >
      {cfg.label}
    </span>
  );
}
