"use client";
import {
  useState,
  useSyncExternalStore,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Scanlines, Vignette } from "../components/overlays";
import { Sidebar } from "../components/sidebar";
import { Footer } from "../components/footer";
import { useAppLanguage } from "../lib/app-language";
import {
  updateRoadmap,
  deleteRoadmap,
  normalizeRoadmapUrl,
} from "../lib/storage";
import { scoreToColor } from "../lib/score-utils";
import type { Roadmap, CategoryRoadmap } from "../types/roadmap";
import type { LighthouseReport } from "../api/analyze/route";

function fireConfetti() {
  void confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#0cce6b", "#6bff8f", "#00ff55", "#ffffff"],
  });
  void confetti({
    particleCount: 60,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: ["#0cce6b", "#6bff8f"],
  });
  void confetti({
    particleCount: 60,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: ["#0cce6b", "#6bff8f"],
  });
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "auditia-roadmaps";

const CATEGORY_LABELS: Record<string, string> = {
  performance: "Performance",
  accessibility: "Accesibilidad",
  seo: "SEO",
  bestPractices: "Buenas Prácticas",
};

const CATEGORY_SHORT: Record<string, string> = {
  performance: "PERF",
  accessibility: "A11Y",
  seo: "SEO",
  bestPractices: "BP",
};

const PRIORITY_COLORS: Record<string, string> = {
  alta: "#ff4e42",
  media: "#ffa400",
  baja: "#0cce6b",
  high: "#ff4e42",
  medium: "#ffa400",
  low: "#0cce6b",
};

function getPriorityLabel(priority: string, language: "es" | "en") {
  const normalized = priority.toLowerCase();
  if (normalized === "alta" || normalized === "high") {
    return language === "en" ? "High" : "Alta";
  }
  if (normalized === "media" || normalized === "medium") {
    return language === "en" ? "Medium" : "Media";
  }
  if (normalized === "baja" || normalized === "low") {
    return language === "en" ? "Low" : "Baja";
  }
  return priority;
}

const ALL_CATEGORIES = [
  "performance",
  "accessibility",
  "seo",
  "bestPractices",
] as const;
const STRATEGIES = ["desktop", "mobile"] as const;
type Strategy = (typeof STRATEGIES)[number];

// ── Storage ───────────────────────────────────────────────────────────────────
function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

let cachedRaw: string | null = null;
let cachedSnapshot: Roadmap[] = [];

function getSnapshot(): Roadmap[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSnapshot = raw ? JSON.parse(raw) : [];
    } catch {
      cachedSnapshot = [];
    }
  }
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: Roadmap[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getScores(roadmap: Roadmap): Record<string, number> {
  // Prefer stored scores (set at generation time), fall back to category data
  if (roadmap.scores) return roadmap.scores as Record<string, number>;
  const map: Record<string, number> = {};
  roadmap.categories.forEach((c) => {
    map[c.category] = c.currentScore;
  });
  return map;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function normalizeStrategy(rawStrategy: string): Strategy {
  return rawStrategy === "mobile" ? "mobile" : "desktop";
}

function getRoadmapGroupsByUrl(roadmaps: Roadmap[]): Roadmap[] {
  const seen = new Set<string>();
  const grouped: Roadmap[] = [];

  for (const roadmap of roadmaps) {
    const key = normalizeRoadmapUrl(roadmap.url);
    if (seen.has(key)) continue;
    seen.add(key);
    grouped.push(roadmap);
  }

  return grouped;
}

function getStrategyAvailability(roadmaps: Roadmap[], url: string) {
  const normalizedUrl = normalizeRoadmapUrl(url);
  return {
    desktop: roadmaps.some(
      (item) =>
        normalizeRoadmapUrl(item.url) === normalizedUrl &&
        normalizeStrategy(item.strategy) === "desktop",
    ),
    mobile: roadmaps.some(
      (item) =>
        normalizeRoadmapUrl(item.url) === normalizedUrl &&
        normalizeStrategy(item.strategy) === "mobile",
    ),
  };
}

function strategyAvailabilityLabel(availability: {
  desktop: boolean;
  mobile: boolean;
}) {
  if (availability.desktop && availability.mobile) return "Desktop/Mobile";
  if (availability.desktop) return "Desktop";
  if (availability.mobile) return "Mobile";
  return "-";
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Corners({ color = "var(--primary)" }: { color?: string }) {
  const SIZE = 11;
  const OFF = -5;
  const W = "1.5px";
  const positions: React.CSSProperties[] = [
    {
      top: OFF,
      left: OFF,
      borderTop: `${W} solid ${color}`,
      borderLeft: `${W} solid ${color}`,
    },
    {
      top: OFF,
      right: OFF,
      borderTop: `${W} solid ${color}`,
      borderRight: `${W} solid ${color}`,
    },
    {
      bottom: OFF,
      left: OFF,
      borderBottom: `${W} solid ${color}`,
      borderLeft: `${W} solid ${color}`,
    },
    {
      bottom: OFF,
      right: OFF,
      borderBottom: `${W} solid ${color}`,
      borderRight: `${W} solid ${color}`,
    },
  ];
  return (
    <>
      {positions.map((style, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            display: "block",
            width: SIZE,
            height: SIZE,
            pointerEvents: "none",
            ...style,
          }}
        />
      ))}
    </>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className="w-3 h-3 transition-transform"
      style={{
        color: "var(--text-dim)",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
      }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DeviceIcon({ device }: { device: Strategy }) {
  if (device === "mobile") {
    return (
      <svg
        className="w-3.5 h-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
        aria-hidden="true"
      >
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="13" rx="1.5" />
      <path strokeLinecap="round" d="M8 21h8M12 17v4" />
    </svg>
  );
}

function ProgressBar({ checked, total }: { checked: number; total: number }) {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--surface-high)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--primary)",
            boxShadow: "0 0 6px rgba(107,255,143,0.4)",
          }}
        />
      </div>
      <span
        className="text-[10px] tabular-nums shrink-0"
        style={{ color: "var(--text-dim)" }}
      >
        {checked}/{total}
      </span>
    </div>
  );
}

// ── Terminal ls listing ───────────────────────────────────────────────────────
function TerminalLs({
  roadmaps,
  allRoadmaps,
  onSelect,
}: {
  roadmaps: Roadmap[];
  allRoadmaps: Roadmap[];
  onSelect: (id: string) => void;
}) {
  const language = useAppLanguage();
  const l = (es: string, en: string) => (language === "en" ? en : es);
  const CMD = "ls -la ./roadmaps/";

  return (
    <div
      className="w-full results-fade-in"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--surface-high)",
        borderLeft: "2px solid var(--primary)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        position: "relative",
      }}
    >
      <Corners />

      {/* Title bar */}
      <div
        className="flex items-center gap-4 px-5 py-3"
        style={{
          borderBottom: "1px solid var(--surface-high)",
          backgroundColor: "var(--surface-high)",
        }}
      >
        <img
          src="/AuditIA.svg"
          alt="AuditIA"
          style={{ width: 20, height: 20, flexShrink: 0 }}
        />
        <span
          className="flex-1 text-center text-[10px] tracking-[0.25em] uppercase"
          style={{ color: "var(--text-dim)" }}
        >
          AUDITIA · ROADMAP MANAGER
        </span>
        <span
          style={{
            fontSize: "9px",
            letterSpacing: "0.14em",
            padding: "2px 8px",
            border: "1px solid var(--primary)",
            color: "var(--primary)",
          }}
        >
          {roadmaps.length} {l("ARCHIVO", "FILE")}
          {roadmaps.length !== 1 ? "S" : ""}
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-4 sm:p-6 md:p-8">
        {/* Static command line */}
        <div
          className="mb-5 flex items-baseline gap-2"
          style={{ fontSize: "0.875rem" }}
        >
          <span style={{ color: "#0cce6b" }}>root@auditia</span>
          <span style={{ color: "var(--text-dim)" }}>:~#</span>
          <span style={{ color: "var(--text)", marginLeft: "0.25rem" }}>
            {CMD}
          </span>
        </div>

        {/* Column headers */}
        <div
          className="flex items-center gap-3 sm:gap-4 px-3 py-1.5 mb-2 text-[9px] tracking-[0.14em] uppercase"
          style={{
            color: "var(--text-dim)",
            borderBottom: "1px solid var(--surface-high)",
            opacity: 0.6,
          }}
        >
          <span className="w-16 sm:w-24 shrink-0">{l("Fecha", "Date")}</span>
          <span className="flex-1">{l("Dominio", "Domain")}</span>
          <span className="hidden md:block w-24 text-center shrink-0">
            {l("Vistas", "Views")}
          </span>
          <span className="w-16 text-right shrink-0">
            {l("Progreso", "Progress")}
          </span>
          <span className="hidden sm:block w-12 text-right shrink-0">
            Tasks
          </span>
        </div>

        {/* Roadmap entries */}
        <div className="flex flex-col gap-0.5">
          {roadmaps.map((r, idx) => {
            const active = r.categories.filter((c) => c.steps.length > 0);
            const total = active.reduce((s, c) => s + c.steps.length, 0);
            const done = active.reduce(
              (s, c) => s + c.steps.filter((s2) => s2.checked).length,
              0,
            );
            const pct = total > 0 ? Math.round((done / total) * 100) : 100;
            const availability = getStrategyAvailability(allRoadmaps, r.url);
            const scores = getScores(r);
            const avgScore =
              Object.keys(scores).length > 0
                ? Math.round(
                    Object.values(scores).reduce((a, b) => a + b, 0) /
                      Object.values(scores).length,
                  )
                : null;
            const domain = getDomain(r.url);
            const localizedDate = new Date(r.createdAt).toLocaleDateString(
              language === "en" ? "en-US" : "es-ES",
              {
                day: "2-digit",
                month: "short",
              },
            );

            return (
              <button
                key={r.id}
                onClick={() => onSelect(r.id)}
                className="ls-entry-in flex items-center gap-3 sm:gap-4 px-3 py-3 text-left group w-full"
                style={{
                  animationDelay: `${idx * 40}ms`,
                  border: "1px solid transparent",
                  transition: "background 0.1s, border-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--surface-high)";
                  e.currentTarget.style.borderColor = "rgba(107,255,143,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                {/* Date */}
                <span
                  className="text-[10px] w-16 sm:w-24 shrink-0"
                  style={{ color: "var(--text-dim)" }}
                >
                  {localizedDate}
                </span>

                {/* Domain + score badges */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <span
                    className="text-xs font-bold truncate"
                    style={{ color: "var(--primary)" }}
                  >
                    <span
                      style={{
                        color: "var(--text-dim)",
                        marginRight: "0.3rem",
                      }}
                    >
                      ./
                    </span>
                    {domain}
                  </span>
                  {avgScore !== null && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 shrink-0 font-bold"
                      style={{
                        color: scoreToColor(avgScore),
                        border: `1px solid ${scoreToColor(avgScore)}40`,
                        backgroundColor: `${scoreToColor(avgScore)}0f`,
                      }}
                    >
                      {avgScore} {l("prom", "avg")}
                    </span>
                  )}
                </div>

                {/* Strategy */}
                <span
                  className="hidden md:block text-[10px] uppercase w-24 text-center shrink-0"
                  style={{ color: "var(--text-dim)" }}
                >
                  {strategyAvailabilityLabel(availability)}
                </span>

                {/* Progress % */}
                <span
                  className="text-xs font-bold w-16 text-right shrink-0"
                  style={{ color: pct === 100 ? "#0cce6b" : "var(--primary)" }}
                >
                  {pct}%
                </span>

                {/* Tasks */}
                <span
                  className="hidden sm:block text-[10px] w-12 text-right shrink-0"
                  style={{ color: "var(--text-dim)" }}
                >
                  {done}/{total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-5 py-2"
        style={{
          borderTop: "1px solid var(--surface-high)",
          backgroundColor: "var(--surface-high)",
        }}
      >
        <span
          className="text-[9px] tracking-[0.12em] uppercase"
          style={{ color: "var(--text-dim)", opacity: 0.6 }}
        >
          {l(
            "Selecciona un roadmap para continuar",
            "Select a roadmap to continue",
          )}
        </span>
        <span
          className="text-[9px]"
          style={{ color: "var(--text-dim)", opacity: 0.4 }}
        >
          {roadmaps.length} {l("roadmap", "roadmap")}
          {roadmaps.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ── Score panel ───────────────────────────────────────────────────────────────
function ScorePanel({ roadmap }: { roadmap: Roadmap }) {
  const language = useAppLanguage();
  const scores = getScores(roadmap);
  const activeSet = new Set(
    roadmap.categories.filter((c) => c.steps.length > 0).map((c) => c.category),
  );

  // Fire confetti when all 4 lighthouse scores are 100
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    confettiFiredRef.current = false;
  }, [roadmap.id]);
  useEffect(() => {
    const allPerfect = ALL_CATEGORIES.every(
      (cat) => (scores[cat] ?? 0) === 100,
    );
    if (allPerfect && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      const end = Date.now() + 2800;
      const burst = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ["#6bff8f", "#0cce6b", "#ffa400", "#fff"],
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ["#6bff8f", "#0cce6b", "#ffa400", "#fff"],
        });
        if (Date.now() < end) requestAnimationFrame(burst);
      };
      burst();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap.id]);

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4"
      style={{
        borderBottom: "1px solid var(--surface-high)",
      }}
    >
      {ALL_CATEGORIES.map((cat, i) => {
        const score = scores[cat] ?? 100;
        const color = scoreToColor(score);
        const label = CATEGORY_SHORT[cat];
        const hasIssues = activeSet.has(cat);
        // Mobile (2-col): border-right on col 0 (i=0,2), border-bottom on row 0 (i=0,1)
        // Desktop (sm, 4-col): border-right on all except last
        const borderClasses = [
          "border-r border-b sm:border-r sm:border-b-0",
          "border-b sm:border-r sm:border-b-0",
          "border-r sm:border-r",
          "sm:border-r-0",
        ][i];

        const prevScore = (
          roadmap.previousScores as Record<string, number> | undefined
        )?.[cat];
        const delta = prevScore !== undefined ? score - prevScore : null;

        return (
          <div
            key={cat}
            className={`flex flex-col items-center gap-1.5 py-4 sm:py-5 ${borderClasses}`}
            style={{ borderColor: "var(--surface-high)" }}
          >
            <span
              className="text-[9px] tracking-[0.14em] uppercase"
              style={{ color: "var(--text-dim)" }}
            >
              {label}
            </span>
            <span
              className="score-pop text-3xl font-black tabular-nums"
              style={{
                color,
                textShadow: `0 0 18px ${color}55`,
                animationDelay: `${i * 80}ms`,
              }}
            >
              {score}
            </span>
            {/* Delta badge */}
            {delta !== null && delta !== 0 && (
              <div
                className="flex items-center gap-0.5 text-[9px] font-bold tabular-nums"
                style={{ color: delta > 0 ? "#0cce6b" : "#ff4e42" }}
              >
                {delta > 0 ? (
                  <svg
                    className="w-2.5 h-2.5"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                  >
                    <path d="M5 1l4 6H1z" />
                  </svg>
                ) : (
                  <svg
                    className="w-2.5 h-2.5"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                  >
                    <path d="M5 9L1 3h8z" />
                  </svg>
                )}
                <span>{Math.abs(delta)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: hasIssues ? "#ffa400" : "#0cce6b",
                  boxShadow: `0 0 5px ${hasIssues ? "#ffa400" : "#0cce6b"}`,
                }}
              />
              <span
                className="text-[9px] uppercase tracking-wider"
                style={{ color: hasIssues ? "#ffa400" : "#0cce6b" }}
              >
                {hasIssues ? (language === "en" ? "improve" : "mejoras") : "ok"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Category section ──────────────────────────────────────────────────────────
function CategorySection({
  cat,
  roadmapId,
}: {
  cat: CategoryRoadmap;
  roadmapId: string;
}) {
  const language = useAppLanguage();
  const l = (es: string, en: string) => (language === "en" ? en : es);
  const [expanded, setExpanded] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const checked = cat.steps.filter((s) => s.checked).length;
  const color = scoreToColor(cat.currentScore);
  const categoryLabels = {
    performance: l("Performance", "Performance"),
    accessibility: l("Accesibilidad", "Accessibility"),
    seo: "SEO",
    bestPractices: l("Buenas Practicas", "Best Practices"),
  } as const;

  function toggleStep(stepId: string) {
    const step = cat.steps.find((s) => s.id === stepId);
    // Prevent unchecking if step is fixed (score reached 100%)
    if (step?.fixedAt && step.checked) return;

    updateRoadmap(roadmapId, (r) => ({
      ...r,
      categories: r.categories.map((c) =>
        c.category !== cat.category
          ? c
          : {
              ...c,
              steps: c.steps.map((s) =>
                s.id !== stepId ? s : { ...s, checked: !s.checked },
              ),
            },
      ),
    }));
  }

  function toggleStepExpand(stepId: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }

  return (
    <div
      style={{
        border: "1px solid var(--surface-high)",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3.5 text-left"
        style={{
          borderBottom: expanded ? "1px solid var(--surface-high)" : "none",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className="text-sm font-black tabular-nums w-8 text-right shrink-0"
          style={{ color, textShadow: `0 0 8px ${color}66` }}
        >
          {cat.currentScore}
        </span>
        <span
          className="text-xs tracking-[0.15em] uppercase font-bold flex-1"
          style={{ color: "var(--text)" }}
        >
          {categoryLabels[cat.category]}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
          {checked}/{cat.steps.length}
        </span>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded && (
        <div className="px-3 sm:px-5 py-4 flex flex-col gap-2">
          <p
            className="text-xs leading-relaxed mb-2"
            style={{ color: "var(--text-dim)" }}
          >
            {cat.objective}
          </p>

          <ProgressBar checked={checked} total={cat.steps.length} />

          <div className="flex flex-col gap-1.5 mt-2">
            {cat.steps.map((step) => {
              const isExpanded = expandedSteps.has(step.id);
              const priorityColor = PRIORITY_COLORS[step.priority] ?? "#888";

              return (
                <div
                  key={step.id}
                  style={{
                    backgroundColor: step.checked
                      ? "rgba(107,255,143,0.04)"
                      : "var(--surface-high)",
                    border: "1px solid",
                    borderColor: step.checked
                      ? "rgba(107,255,143,0.18)"
                      : "transparent",
                    transition: "background 0.25s, border-color 0.25s",
                  }}
                >
                  <div className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-3">
                    {/* Checkbox */}
                    <button
                      className="mt-0.5 shrink-0 px-1.5 py-0.5 text-[11px] font-bold tracking-[0.08em] transition-all duration-150"
                      aria-label={
                        step.checked
                          ? step.fixedAt
                            ? l("Completado y fijado", "Completed and locked")
                            : l("Marcar como pendiente", "Mark as pending")
                          : l("Marcar como completado", "Mark as completed")
                      }
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        color: step.checked ? "#0cce6b" : "var(--text-dim)",
                        border: "1px solid",
                        borderColor: step.checked
                          ? "rgba(12,206,107,0.45)"
                          : "var(--outline)",
                        backgroundColor: step.checked
                          ? step.fixedAt
                            ? "rgba(12,206,107,0.15)"
                            : "rgba(12,206,107,0.08)"
                          : "transparent",
                        boxShadow: step.checked
                          ? "0 0 10px rgba(12,206,107,0.28)"
                          : "none",
                        cursor:
                          step.fixedAt && step.checked
                            ? "not-allowed"
                            : "pointer",
                        opacity: step.fixedAt && step.checked ? 0.8 : 1,
                      }}
                      onClick={() => toggleStep(step.id)}
                      disabled={step.fixedAt && step.checked}
                      onMouseEnter={(e) => {
                        if (!step.checked && !step.fixedAt) {
                          e.currentTarget.style.color = "var(--primary)";
                          e.currentTarget.style.borderColor =
                            "rgba(107,255,143,0.35)";
                          e.currentTarget.style.backgroundColor =
                            "rgba(107,255,143,0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!step.checked && !step.fixedAt) {
                          e.currentTarget.style.color = "var(--text-dim)";
                          e.currentTarget.style.borderColor = "var(--outline)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {step.checked && step.fixedAt
                        ? "✓"
                        : step.checked
                          ? "[X]"
                          : "[ ]"}
                    </button>

                    {/* Title + priority + impact */}
                    <div className="flex-1 min-w-0">
                      <button
                        className="w-full text-left flex items-start gap-2 flex-wrap"
                        onClick={() => toggleStepExpand(step.id)}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{
                            color: step.checked
                              ? "var(--text-dim)"
                              : "var(--text)",
                            textDecoration: step.checked
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {step.title}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-bold shrink-0"
                          style={{
                            color: priorityColor,
                            backgroundColor: `${priorityColor}15`,
                            border: `1px solid ${priorityColor}30`,
                          }}
                        >
                          {getPriorityLabel(step.priority, language)}
                        </span>
                      </button>
                      <div
                        className="text-[10px] mt-1"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {step.estimatedImpact}
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <button
                      className="mt-1 shrink-0"
                      onClick={() => toggleStepExpand(step.id)}
                    >
                      <ChevronIcon expanded={isExpanded} />
                    </button>
                  </div>

                  {/* Description (expandable) */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-3 pt-0 ml-7"
                      style={{ borderTop: "1px solid var(--surface-high)" }}
                    >
                      <p
                        className="text-xs leading-relaxed whitespace-pre-line pt-3"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {step.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Roadmap card ──────────────────────────────────────────────────────────────
function RoadmapCard({
  roadmaps,
  selectedRoadmap,
  onBack,
}: {
  roadmaps: Roadmap[];
  selectedRoadmap: Roadmap;
  onBack?: () => void;
}) {
  const language = useAppLanguage();
  const l = (es: string, en: string) => (language === "en" ? en : es);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState("");
  const [activeStrategy, setActiveStrategy] = useState<Strategy>(
    normalizeStrategy(selectedRoadmap.strategy),
  );
  type ModalState = "idle" | "prompt" | "analyzing" | "success" | "partial";
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [partialCats, setPartialCats] = useState<string[]>([]);
  const [modalError, setModalError] = useState("");
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    setActiveStrategy(normalizeStrategy(selectedRoadmap.strategy));
    setShowConfirm(false);
    setReanalyzeError("");
    setModalState("idle");
    setPartialCats([]);
    setModalError("");
  }, [selectedRoadmap.id]);

  const normalizedUrl = normalizeRoadmapUrl(selectedRoadmap.url);
  const strategyRoadmaps: Record<Strategy, Roadmap | undefined> = {
    desktop: roadmaps.find(
      (item) =>
        normalizeRoadmapUrl(item.url) === normalizedUrl &&
        normalizeStrategy(item.strategy) === "desktop",
    ),
    mobile: roadmaps.find(
      (item) =>
        normalizeRoadmapUrl(item.url) === normalizedUrl &&
        normalizeStrategy(item.strategy) === "mobile",
    ),
  };

  const roadmap = strategyRoadmaps[activeStrategy];

  // Compute progress before early return so hooks are always called in same order
  const _activeCategories = roadmap
    ? roadmap.categories.filter((c) => c.steps.length > 0)
    : [];
  const _totalSteps = _activeCategories.reduce((s, c) => s + c.steps.length, 0);
  const _checkedSteps = _activeCategories.reduce(
    (s, c) => s + c.steps.filter((st) => st.checked).length,
    0,
  );

  // Auto-open completion prompt when every step is checked
  useEffect(() => {
    if (
      _totalSteps > 0 &&
      _checkedSteps === _totalSteps &&
      modalState === "idle"
    ) {
      setModalState("prompt");
    }
    if (_checkedSteps < _totalSteps && modalState === "prompt") {
      setModalState("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_checkedSteps, _totalSteps]);

  async function runLighthouse(fromModal = false): Promise<void> {
    const current = strategyRoadmaps[activeStrategy];
    if (!current) return;
    if (fromModal) {
      setModalState("analyzing");
      setModalError("");
    } else {
      setReanalyzeError("");
      setReanalyzing(true);
    }
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: current.url, strategy: activeStrategy }),
      });
      const data = (await res.json()) as LighthouseReport & { error?: string };
      if (!res.ok) {
        const msg =
          data?.error ??
          (language === "en" ? "Analysis failed" : "Análisis fallido");
        if (fromModal) {
          setModalError(msg);
          setModalState("prompt");
        } else {
          setReanalyzeError(msg);
          setReanalyzing(false);
        }
        return;
      }
      const newScores = {
        performance: data.categories.performance.score,
        accessibility: data.categories.accessibility.score,
        seo: data.categories.seo.score,
        bestPractices: data.categories.bestPractices.score,
      };

      // Identify which categories are now fixed (100% score)
      const fixedCategories = (
        Object.keys(newScores) as (keyof typeof newScores)[]
      ).filter((k) => newScores[k] === 100);
      const now = new Date().toISOString();

      // Update roadmap with new scores, uncheck all steps, and mark fixed items
      updateRoadmap(current.id, (r) => ({
        ...r,
        previousScores: r.scores,
        scores: newScores,
        reanalyzedAt: now,
        categories: r.categories.map((cat) => ({
          ...cat,
          currentScore: newScores[cat.category as keyof typeof newScores],
          // Uncheck all steps; mark as fixed if category is now at 100%
          steps: cat.steps.map((s) => ({
            ...s,
            checked: false,
            fixedAt: fixedCategories.includes(
              cat.category as keyof typeof newScores,
            )
              ? now
              : undefined,
          })),
        })),
      }));

      if (fromModal) {
        const allPerfect = Object.values(newScores).every((s) => s === 100);
        if (allPerfect) {
          setModalState("success");
          fireConfetti();
        } else {
          const still = (
            Object.keys(newScores) as (keyof typeof newScores)[]
          ).filter((k) => newScores[k] < 100);
          setPartialCats(still);
          setModalState("partial");
        }
      } else {
        setReanalyzing(false);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : language === "en"
            ? "Unknown error"
            : "Error desconocido";
      if (fromModal) {
        setModalError(msg);
        setModalState("prompt");
      } else {
        setReanalyzeError(msg);
        setReanalyzing(false);
      }
    }
  }

  function handleReanalyze() {
    setReanalyzing(true);
    runLighthouse(false);
  }
  const selectedDate = new Date(selectedRoadmap.createdAt).toLocaleDateString(
    language === "en" ? "en-US" : "es-ES",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  if (!roadmap) {
    const analyzeHref = `/?url=${encodeURIComponent(
      selectedRoadmap.url,
    )}&strategy=${activeStrategy}&autorun=1&autogenerate=1`;

    return (
      <div className="results-fade-in" style={{ position: "relative" }}>
        <Corners color="rgba(107,255,143,0.3)" />
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--surface-high)",
          }}
        >
          <div
            className="flex items-center gap-3 px-6 py-3 flex-wrap"
            style={{
              borderBottom: "1px solid var(--surface-high)",
              backgroundColor: "var(--surface-high)",
            }}
          >
            {onBack && (
              <button
                onClick={onBack}
                className="text-[10px] px-2.5 py-1 uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shrink-0"
                style={{
                  color: "var(--primary)",
                  border: "1px solid rgba(107,255,143,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(107,255,143,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                ← ls
              </button>
            )}
            <span style={{ color: "#0cce6b", opacity: 0.6, fontSize: "11px" }}>
              {"// "}
            </span>
            <span
              className="text-[10px] tracking-[0.18em] uppercase flex-1 truncate"
              style={{ color: "var(--primary)" }}
            >
              {selectedRoadmap.url}
            </span>
            <div
              className="flex items-center gap-1.5 shrink-0"
              role="tablist"
              aria-label={l("Vista por dispositivo", "Device view")}
            >
              {STRATEGIES.map((device) => {
                const isActive = activeStrategy === device;
                const exists = !!strategyRoadmaps[device];
                return (
                  <button
                    key={device}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveStrategy(device)}
                    className="px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] inline-flex items-center gap-1.5"
                    style={{
                      color: isActive ? "var(--primary-on)" : "var(--text-dim)",
                      backgroundColor: isActive
                        ? "var(--primary)"
                        : "var(--surface)",
                      border: exists
                        ? "1px solid var(--outline)"
                        : "1px solid rgba(255,164,0,0.35)",
                    }}
                  >
                    <DeviceIcon device={device} />
                    {device === "desktop" ? "Desktop" : "Mobile"}
                  </button>
                );
              })}
            </div>
            <span
              className="text-[10px] shrink-0"
              style={{ color: "var(--text-dim)" }}
            >
              {selectedDate}
            </span>
          </div>

          <div className="px-6 py-8 flex flex-col gap-4">
            <div
              className="text-[11px] tracking-[0.15em] uppercase"
              style={{ color: "#ffa400" }}
            >
              {l("No existe roadmap para", "No roadmap for")}{" "}
              {activeStrategy === "desktop" ? "Desktop" : "Mobile"}
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-dim)" }}
            >
              {l(
                "Este dominio ya tiene roadmap en el otro dispositivo. Ejecuta un analisis en",
                "This domain already has a roadmap for the other device. Run an analysis in",
              )}{" "}
              {activeStrategy === "desktop" ? "Desktop" : "Mobile"}{" "}
              {l("para crear su roadmap.", "to create its roadmap.")}
            </p>
            <Link
              href={analyzeHref}
              className="inline-flex items-center justify-center px-4 py-3 text-[11px] tracking-[0.2em] uppercase font-bold"
              style={{
                color: "var(--primary-on)",
                backgroundColor: "var(--primary)",
                width: "fit-content",
              }}
            >
              &gt; {l("Ejecutar analisis", "Run analysis")}{" "}
              {activeStrategy === "desktop" ? "Desktop" : "Mobile"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeCategories = roadmap.categories.filter((c) => c.steps.length > 0);
  const totalSteps = activeCategories.reduce(
    (sum, c) => sum + c.steps.length,
    0,
  );
  const checkedSteps = activeCategories.reduce(
    (sum, c) => sum + c.steps.filter((s) => s.checked).length,
    0,
  );
  const pct =
    totalSteps > 0 ? Math.round((checkedSteps / totalSteps) * 100) : 100;

  const date = new Date(roadmap.createdAt).toLocaleDateString(
    language === "en" ? "en-US" : "es-ES",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <div className="results-fade-in" style={{ position: "relative" }}>
      <Corners color="rgba(107,255,143,0.3)" />
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--surface-high)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-3 flex-wrap"
          style={{
            borderBottom: "1px solid var(--surface-high)",
            backgroundColor: "var(--surface-high)",
          }}
        >
          {onBack && (
            <button
              onClick={onBack}
              className="text-[10px] px-2.5 py-1 uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shrink-0"
              style={{
                color: "var(--primary)",
                border: "1px solid rgba(107,255,143,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(107,255,143,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              ← ls
            </button>
          )}
          <span style={{ color: "#0cce6b", opacity: 0.6, fontSize: "11px" }}>
            {"// "}
          </span>
          <span
            className="text-[10px] tracking-[0.18em] uppercase flex-1 truncate"
            style={{ color: "var(--primary)" }}
          >
            {roadmap.url}
          </span>
          <div
            className="flex items-center gap-1.5 shrink-0"
            role="tablist"
            aria-label={l("Vista por dispositivo", "Device view")}
          >
            {STRATEGIES.map((device) => {
              const isActive = activeStrategy === device;
              const exists = !!strategyRoadmaps[device];
              return (
                <button
                  key={device}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveStrategy(device);
                    setShowConfirm(false);
                  }}
                  className="px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] inline-flex items-center gap-1.5"
                  style={{
                    color: isActive ? "var(--primary-on)" : "var(--text-dim)",
                    backgroundColor: isActive
                      ? "var(--primary)"
                      : "var(--surface)",
                    border: exists
                      ? "1px solid var(--outline)"
                      : "1px solid rgba(255,164,0,0.35)",
                  }}
                >
                  <DeviceIcon device={device} />
                  {device === "desktop" ? "Desktop" : "Mobile"}
                </button>
              );
            })}
          </div>
          <span
            className="text-[10px] shrink-0"
            style={{ color: "var(--text-dim)" }}
          >
            {date}
          </span>

          {/* Delete */}
          {!showConfirm ? (
            <button
              className="text-[10px] px-2 py-0.5 uppercase tracking-wider transition-colors shrink-0"
              style={{
                color: "#ff4e42",
                border: "1px solid rgba(255,78,66,0.3)",
              }}
              onClick={() => setShowConfirm(true)}
            >
              {l("Eliminar", "Delete")}
            </button>
          ) : (
            <div className="flex gap-1 shrink-0">
              <button
                className="text-[10px] px-2 py-0.5 uppercase tracking-wider"
                style={{
                  color: "#ff4e42",
                  backgroundColor: "rgba(255,78,66,0.12)",
                  border: "1px solid rgba(255,78,66,0.3)",
                }}
                onClick={() => deleteRoadmap(roadmap.id)}
              >
                {l("Confirmar", "Confirm")}
              </button>
              <button
                className="text-[10px] px-2 py-0.5 uppercase tracking-wider"
                style={{
                  color: "var(--text-dim)",
                  border: "1px solid var(--outline)",
                }}
                onClick={() => setShowConfirm(false)}
              >
                {l("Cancelar", "Cancel")}
              </button>
            </div>
          )}
        </div>

        {/* Re-analyze error banner */}
        {reanalyzeError && (
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-2.5"
            style={{
              borderBottom: "1px solid rgba(255,78,66,0.2)",
              backgroundColor: "rgba(255,78,66,0.06)",
            }}
          >
            <span className="text-[10px]" style={{ color: "#ff4e42" }}>
              {reanalyzeError}
            </span>
            <button
              className="text-[10px] px-1.5 py-0.5"
              style={{
                color: "#ff4e42",
                border: "1px solid rgba(255,78,66,0.3)",
              }}
              onClick={() => setReanalyzeError("")}
            >
              ✕
            </button>
          </div>
        )}

        {/* Language mismatch banner */}
        {(roadmap.language ?? "es") !== language && (
          <div
            className="flex items-center gap-3 px-6 py-3 flex-wrap"
            style={{
              borderBottom: "1px solid rgba(255,164,0,0.2)",
              backgroundColor: "rgba(255,164,0,0.06)",
            }}
          >
            <span
              className="text-[10px] leading-relaxed flex-1"
              style={{ color: "#ffa400" }}
            >
              {l(
                "Este roadmap fue generado en inglés. Regeneralo para verlo en español.",
                "This roadmap was generated in Spanish. Regenerate it to view it in English.",
              )}
            </span>
            <Link
              href={`/?url=${encodeURIComponent(roadmap.url)}&strategy=${roadmap.strategy}&autorun=1&autogenerate=1`}
              className="text-[10px] px-3 py-1 uppercase tracking-wider font-bold shrink-0 transition-colors"
              style={{
                color: "#ffa400",
                border: "1px solid rgba(255,164,0,0.4)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  "rgba(255,164,0,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  "transparent";
              }}
            >
              &gt; {l("Regenerar", "Regenerate")}
            </Link>
          </div>
        )}

        {/* Score panel — all 4 categories */}
        <ScorePanel roadmap={roadmap} />

        {/* Progress + summary */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div
              className="text-3xl font-black tabular-nums"
              style={{
                color: "var(--primary)",
                textShadow: "0 0 24px rgba(107,255,143,0.35)",
              }}
            >
              {pct}%
            </div>
            <div className="flex-1">
              <div
                className="text-[10px] tracking-[0.15em] uppercase mb-1.5"
                style={{ color: "var(--text-dim)" }}
              >
                {l("Progreso del roadmap", "Roadmap progress")}
              </div>
              <ProgressBar checked={checkedSteps} total={totalSteps} />
            </div>
          </div>
        </div>

        {/* Categories — only those with actual steps */}
        <div className="px-3 sm:px-6 pb-4 sm:pb-6 flex flex-col gap-3">
          {roadmap.categories
            .filter((cat) => cat.steps.length > 0)
            .map((cat) => (
              <CategorySection
                key={cat.category}
                cat={cat}
                roadmapId={roadmap.id}
              />
            ))}

          {/* Re-analyze button at bottom */}
          <button
            className="text-[10px] px-3 py-2.5 uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 font-bold mt-2"
            style={{
              color: reanalyzing ? "var(--text-dim)" : "var(--primary-on)",
              backgroundColor: reanalyzing
                ? "var(--surface-high)"
                : "var(--primary)",
              border: `1px solid ${reanalyzing ? "var(--outline)" : "var(--primary)"}`,
            }}
            onClick={handleReanalyze}
            disabled={reanalyzing}
            title={l(
              "Re-analizar con Lighthouse",
              "Re-analyze with Lighthouse",
            )}
            onMouseEnter={(e) => {
              if (!reanalyzing)
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 12px rgba(107,255,143,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            {reanalyzing ? (
              <svg
                className="w-3 h-3 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  d="M4 4v5h5M20 20v-5h-5M4.07 15a8 8 0 1013.86-8"
                />
              </svg>
            )}
            {reanalyzing
              ? l("Analizando...", "Analyzing...")
              : l("Re-analizar", "Re-analyze")}
          </button>
        </div>

        {/* Completion Modal */}
        {modalState !== "idle" && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            style={{ opacity: 0.95 }}
          >
            <div
              className="results-fade-in relative"
              style={{
                backgroundColor: "var(--surface)",
                border: "1.5px solid var(--surface-high)",
                maxWidth: "500px",
                width: "100%",
              }}
            >
              <Corners color="var(--primary)" />

              {/* Prompt State: All steps checked, asking for confirmation */}
              {modalState === "prompt" && (
                <>
                  <div
                    className="px-6 py-4"
                    style={{
                      borderBottom: "1px solid var(--surface-high)",
                      backgroundColor: "var(--surface-high)",
                    }}
                  >
                    <h2
                      className="text-sm font-bold tracking-widest"
                      style={{ color: "var(--primary)" }}
                    >
                      {l("CONFIRMACIÓN", "CONFIRMATION")}
                    </h2>
                  </div>

                  <div className="px-6 py-5 flex flex-col gap-4">
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--text)" }}
                    >
                      {l(
                        "¡Parece que completaste todo el roadmap! 🎉 Confirma que todos los cambios están listos ejecutando un nuevo análisis de Lighthouse para verificar que alcanzamos el 100%.",
                        "It looks like you've completed the entire roadmap! 🎉 Confirm that all changes are ready by running a new Lighthouse analysis to verify we achieved 100%.",
                      )}
                    </p>

                    {modalError && (
                      <div
                        className="px-3 py-2 text-[10px]"
                        style={{
                          backgroundColor: "rgba(255,78,66,0.12)",
                          border: "1px solid rgba(255,78,66,0.3)",
                          color: "#ff4e42",
                        }}
                      >
                        {modalError}
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        className="text-[10px] px-3 py-2 uppercase tracking-wider transition-colors"
                        style={{
                          color: "var(--text-dim)",
                          border: "1px solid var(--outline)",
                        }}
                        onClick={() => setModalState("idle")}
                      >
                        {l("Cancelar", "Cancel")}
                      </button>
                      <button
                        className="text-[10px] px-3 py-2 uppercase tracking-wider font-bold disabled:opacity-40 transition-all"
                        style={{
                          color: "var(--primary-on)",
                          backgroundColor: "var(--primary)",
                          border: "1px solid var(--primary)",
                        }}
                        onClick={() => runLighthouse(true)}
                        disabled={modalState === "analyzing"}
                        onMouseEnter={(e) => {
                          if (modalState !== "analyzing") {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.boxShadow =
                              "0 0 12px rgba(107,255,143,0.3)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.boxShadow = "none";
                        }}
                      >
                        {modalState === "analyzing"
                          ? l("Analizando...", "Analyzing...")
                          : l("Re-analizar", "Re-analyze")}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Analyzing State */}
              {modalState === "analyzing" && (
                <>
                  <div
                    className="px-6 py-4"
                    style={{
                      borderBottom: "1px solid var(--surface-high)",
                      backgroundColor: "var(--surface-high)",
                    }}
                  >
                    <h2
                      className="text-sm font-bold tracking-widest flex items-center gap-2"
                      style={{ color: "var(--primary)" }}
                    >
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                        />
                      </svg>
                      {l("ANALIZANDO", "ANALYZING")}
                    </h2>
                  </div>
                  <div className="px-6 py-8 text-center">
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {l(
                        "Ejecutando Lighthouse... Por favor espera.",
                        "Running Lighthouse analysis... Please wait.",
                      )}
                    </p>
                  </div>
                </>
              )}

              {/* Success State: All scores 100 */}
              {modalState === "success" && (
                <>
                  <div
                    className="px-6 py-4"
                    style={{
                      borderBottom: "1px solid var(--surface-high)",
                      backgroundColor: "rgba(12,206,107,0.08)",
                      borderBottomColor: "rgba(12,206,107,0.2)",
                    }}
                  >
                    <h2
                      className="text-sm font-bold tracking-widest flex items-center gap-2"
                      style={{ color: "#0cce6b" }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {l("¡FELICIDADES!", "CONGRATULATIONS!")}
                    </h2>
                  </div>
                  <div className="px-6 py-6 flex flex-col gap-4">
                    <div className="text-center">
                      <p
                        className="text-sm font-bold mb-2"
                        style={{ color: "var(--text)" }}
                      >
                        {l(
                          "🎉 ¡Alcanzaste el 100% en todas las métricas!",
                          "🎉 You achieved 100% on all metrics!",
                        )}
                      </p>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {l(
                          "Tu sitio web está en perfecto estado. Excelente trabajo en mejorar el rendimiento, accesibilidad, SEO y mejores prácticas.",
                          "Your website is in perfect condition. Excellent work improving performance, accessibility, SEO, and best practices.",
                        )}
                      </p>
                    </div>
                    <button
                      className="text-[10px] px-3 py-2.5 uppercase tracking-wider font-bold transition-all"
                      style={{
                        color: "var(--primary-on)",
                        backgroundColor: "var(--primary)",
                        border: "1px solid var(--primary)",
                      }}
                      onClick={() => setModalState("idle")}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "0 0 12px rgba(107,255,143,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "none";
                      }}
                    >
                      {l("Cerrar", "Close")}
                    </button>
                  </div>
                </>
              )}

              {/* Partial State: Some scores still need work */}
              {modalState === "partial" && (
                <>
                  <div
                    className="px-6 py-4"
                    style={{
                      borderBottom: "1px solid var(--surface-high)",
                      backgroundColor: "rgba(255,164,0,0.08)",
                      borderBottomColor: "rgba(255,164,0,0.2)",
                    }}
                  >
                    <h2
                      className="text-sm font-bold tracking-widest flex items-center gap-2"
                      style={{ color: "#ffa400" }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {l("¡CASI LISTO!", "ALMOST THERE!")}
                    </h2>
                  </div>
                  <div className="px-6 py-6 flex flex-col gap-4">
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--text)" }}
                    >
                      {l(
                        "¡Estamos muy cerca! Aquí están las métricas que aún necesitan mejoras. Sigue trabajando en estos puntos. 💪",
                        "We're almost there! Here are the metrics that still need improvements. Keep working on these areas. 💪",
                      )}
                    </p>

                    {/* Show only categories that need fixing */}
                    <div className="flex flex-col gap-2">
                      {partialCats.map((cat) => {
                        const scores = getScores(selectedRoadmap);
                        const score = scores[cat as keyof typeof scores] ?? 0;
                        const label = CATEGORY_LABELS[cat];
                        const color = scoreToColor(score);
                        return (
                          <div
                            key={cat}
                            className="px-3 py-2 flex items-center gap-3"
                            style={{
                              backgroundColor: "var(--surface-high)",
                              border: "1px solid rgba(255,164,0,0.2)",
                            }}
                          >
                            <span
                              className="text-sm font-bold tabular-nums"
                              style={{ color, minWidth: "40px" }}
                            >
                              {score}
                            </span>
                            <span
                              className="text-xs uppercase tracking-wider"
                              style={{ color: "var(--text-dim)" }}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        className="text-[10px] px-3 py-2 uppercase tracking-wider transition-colors"
                        style={{
                          color: "var(--text-dim)",
                          border: "1px solid var(--outline)",
                        }}
                        onClick={() => setModalState("idle")}
                      >
                        {l("Seguir trabajando", "Keep working")}
                      </button>
                      <button
                        className="text-[10px] px-3 py-2 uppercase tracking-wider font-bold transition-all"
                        style={{
                          color: "var(--primary-on)",
                          backgroundColor: "var(--primary)",
                          border: "1px solid var(--primary)",
                        }}
                        onClick={() => runLighthouse(true)}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.boxShadow = "0 0 12px rgba(107,255,143,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.boxShadow = "none";
                        }}
                      >
                        {l("Re-analizar", "Re-analyze")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RoadmapsPage() {
  const language = useAppLanguage();
  const l = (es: string, en: string) => (language === "en" ? en : es);
  const roadmaps = useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    () => SERVER_SNAPSHOT,
  );
  const groupedRoadmaps = useMemo(
    () => getRoadmapGroupsByUrl(roadmaps),
    [roadmaps],
  );
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    searchParams.get("id"),
  );

  // When only 1 roadmap, go straight to detail
  const showLs = groupedRoadmaps.length > 1 && selectedId === null;
  const activeRoadmap =
    selectedId != null
      ? (roadmaps.find((r) => r.id === selectedId) ?? roadmaps[0])
      : groupedRoadmaps.length === 1
        ? groupedRoadmaps[0]
        : null;

  // If selected roadmap was deleted, go back to ls
  useEffect(() => {
    if (selectedId && !roadmaps.find((r) => r.id === selectedId)) {
      setSelectedId(null);
    }
  }, [roadmaps, selectedId]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--bg)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
      }}
    >
      <Scanlines />
      <Vignette />
      <Sidebar />

      <main
        className="flex flex-col min-h-screen px-3 sm:px-6 lg:px-14 py-10 sm:py-12 pt-14 sm:pt-12"
        style={{
          marginLeft: "var(--sidebar-w, 15rem)",
          transition: "margin-left 0.2s ease",
        }}
      >
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <h1
            className="text-sm tracking-[0.3em] uppercase font-bold"
            style={{ color: "var(--text)" }}
          >
            {l("Roadmaps", "Roadmaps")}
          </h1>
          {groupedRoadmaps.length > 0 && (
            <span
              className="text-[10px] px-2 py-0.5 tabular-nums"
              style={{
                color: "var(--primary)",
                backgroundColor: "rgba(107,255,143,0.08)",
                border: "1px solid rgba(107,255,143,0.2)",
              }}
            >
              {groupedRoadmaps.length}
            </span>
          )}
        </div>

        {/* Main content */}
        {groupedRoadmaps.length === 0 ? (
          /* Empty state — terminal style */
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              <div
                className="text-left px-8 py-6"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--surface-high)",
                  borderLeft: "2px solid var(--outline)",
                }}
              >
                <div className="flex items-baseline gap-2 text-sm mb-3">
                  <span style={{ color: "#0cce6b" }}>root@auditia</span>
                  <span style={{ color: "var(--text-dim)" }}>:~/roadmaps#</span>
                  <span style={{ color: "var(--text)" }}>ls -la</span>
                </div>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                  total 0
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--outline)" }}
                >
                  {l(
                    "No se encontraron roadmaps en este directorio.",
                    "No roadmaps were found in this directory.",
                  )}
                </div>
              </div>
              <Link
                href="/"
                className="text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 transition-all"
                style={{
                  color: "var(--primary)",
                  border: "1px solid var(--primary)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(107,255,143,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                }}
              >
                &gt; {l("Ir al analisis", "Go to analysis")}
              </Link>
            </div>
          </div>
        ) : showLs ? (
          <TerminalLs
            roadmaps={groupedRoadmaps}
            allRoadmaps={roadmaps}
            onSelect={setSelectedId}
          />
        ) : activeRoadmap ? (
          <div className="flex flex-col gap-8">
            <RoadmapCard
              roadmaps={roadmaps}
              selectedRoadmap={activeRoadmap}
              onBack={
                groupedRoadmaps.length > 1
                  ? () => setSelectedId(null)
                  : undefined
              }
            />
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
