"use client";

const LEVELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  elite:    { label: "Elite",    bg: "rgba(212,175,55,0.15)",  text: "#E6C84A", border: "rgba(212,175,55,0.35)" },
  premium:  { label: "Premium",  bg: "rgba(91,79,232,0.15)",   text: "#8B7FF0", border: "rgba(91,79,232,0.35)"  },
  advanced: { label: "Advanced", bg: "rgba(16,185,129,0.15)",  text: "#34D399", border: "rgba(16,185,129,0.35)" },
  growing:  { label: "Growing",  bg: "rgba(6,182,212,0.15)",   text: "#22D3EE", border: "rgba(6,182,212,0.35)"  },
  emerging: { label: "Emerging", bg: "rgba(249,115,22,0.15)",  text: "#FB923C", border: "rgba(249,115,22,0.35)" },
  risk:     { label: "Risk",     bg: "rgba(239,68,68,0.15)",   text: "#F87171", border: "rgba(239,68,68,0.35)"  },
};

export default function LevelBadge({ level, size = "sm" }: { level: string; size?: "sm" | "md" | "lg" }) {
  const cfg = LEVELS[level] ?? { label: "Risk", bg: "rgba(239,68,68,0.15)", text: "#F87171", border: "rgba(239,68,68,0.35)" };
  const pad = size === "sm" ? "2px 8px" : size === "md" ? "4px 12px" : "6px 16px";
  const fs  = size === "sm" ? "11px"    : size === "md" ? "13px"     : "15px";
  return (
    <span style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, borderRadius: "9999px", padding: pad, fontSize: fs, fontWeight: 600, letterSpacing: "0.04em", display: "inline-flex", alignItems: "center" }}>
      {cfg.label}
    </span>
  );
}
