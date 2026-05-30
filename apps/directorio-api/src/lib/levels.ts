export const LEVEL_THRESHOLDS = {
  elite:    83,
  premium:  80,
  advanced: 73,
  growing:  61,
  emerging: 50,
} as const;

export const LEVEL_LABELS: Record<string, string> = {
  elite:    "World-Class Operator",
  premium:  "High Trust",
  advanced: "Digitally Mature",
  growing:  "Mid Maturity",
  emerging: "Low Digitalization",
  risk:     "Weak Trust",
};

export function getLevelLabel(level: string): string {
  return LEVEL_LABELS[level] ?? level;
}

export function scoreToLevel(score: number): string {
  if (score >= LEVEL_THRESHOLDS.elite)    return "elite";
  if (score >= LEVEL_THRESHOLDS.premium)  return "premium";
  if (score >= LEVEL_THRESHOLDS.advanced) return "advanced";
  if (score >= LEVEL_THRESHOLDS.growing)  return "growing";
  if (score >= LEVEL_THRESHOLDS.emerging) return "emerging";
  return "risk";
}
