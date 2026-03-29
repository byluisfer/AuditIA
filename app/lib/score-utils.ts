export function scoreToColor(score: number | null): string {
  if (score === null) return "var(--text-dim)";
  if (score >= 90) return "#0cce6b";
  if (score >= 50) return "#ffa400";
  return "#ff4e42";
}

export function scoreToLabel(score: number): string {
  if (score >= 90) return "ÓPTIMO";
  if (score >= 50) return "REGULAR";
  return "CRÍTICO";
}
