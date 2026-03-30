export function scoreToColor(score: number | null): string {
  if (score === null) return "var(--text-dim)";
  if (score >= 90) return "#0cce6b";
  if (score >= 50) return "#ffa400";
  return "#ff4e42";
}

export function scoreToLabel(
  score: number,
  language: "es" | "en" = "es",
): string {
  if (score >= 90) return language === "en" ? "OPTIMAL" : "OPTIMO";
  if (score >= 50) return language === "en" ? "FAIR" : "REGULAR";
  return language === "en" ? "CRITICAL" : "CRITICO";
}
