"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Scanlines, Vignette } from "../components/overlays";
import { Sidebar } from "../components/sidebar";
import { Footer } from "../components/footer";
import { updateRoadmap, deleteRoadmap } from "../lib/storage";
import { scoreToColor } from "../lib/score-utils";
import type { Roadmap, CategoryRoadmap } from "../types/roadmap";

// ── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "auditia-roadmaps";

const CATEGORY_LABELS: Record<string, string> = {
  performance: "Performance",
  accessibility: "Accesibilidad",
  seo: "SEO",
  bestPractices: "Buenas Prácticas",
};

const PRIORITY_COLORS: Record<string, string> = {
  alta: "#ff4e42",
  media: "#ffa400",
  baja: "#0cce6b",
};

// ── localStorage sync ────────────────────────────────────────────────────────
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

// ── Shared UI ────────────────────────────────────────────────────────────────
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

function ProgressBar({ checked, total }: { checked: number; total: number }) {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--surface-high)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: "var(--primary)" }}
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

// ── Category section ─────────────────────────────────────────────────────────
function CategorySection({
  cat,
  roadmapId,
}: {
  cat: CategoryRoadmap;
  roadmapId: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const checked = cat.steps.filter((s) => s.checked).length;

  function toggleStep(stepId: string) {
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
      {/* Category header */}
      <button
        className="w-full flex items-center gap-3 px-5 py-3 text-left"
        style={{
          borderBottom: expanded ? "1px solid var(--surface-high)" : "none",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className="text-[10px] font-bold"
          style={{ color: scoreToColor(cat.currentScore) }}
        >
          {cat.currentScore}
        </span>
        <span
          className="text-xs tracking-[0.15em] uppercase font-bold flex-1"
          style={{ color: "var(--text)" }}
        >
          {CATEGORY_LABELS[cat.category] ?? cat.category}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
          {checked}/{cat.steps.length}
        </span>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded && (
        <div className="px-5 py-4 flex flex-col gap-2">
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
              const priorityColor = PRIORITY_COLORS[step.priority];

              return (
                <div
                  key={step.id}
                  style={{
                    backgroundColor: step.checked
                      ? "rgba(107,255,143,0.04)"
                      : "var(--surface-high)",
                    border: "1px solid",
                    borderColor: step.checked
                      ? "rgba(107,255,143,0.15)"
                      : "transparent",
                  }}
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    {/* Checkbox */}
                    <button
                      className="mt-0.5 shrink-0 w-4 h-4 border flex items-center justify-center"
                      style={{
                        borderColor: step.checked
                          ? "var(--primary)"
                          : "var(--outline)",
                        backgroundColor: step.checked
                          ? "var(--primary)"
                          : "transparent",
                      }}
                      onClick={() => toggleStep(step.id)}
                    >
                      {step.checked && (
                        <svg
                          className="w-2.5 h-2.5"
                          fill="none"
                          stroke="var(--primary-on)"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Title + priority + impact */}
                    <div className="flex-1 min-w-0">
                      <button
                        className="w-full text-left flex items-center gap-2"
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
                          {step.priority}
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

// ── Roadmap card ─────────────────────────────────────────────────────────────
function RoadmapCard({ roadmap }: { roadmap: Roadmap }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const totalSteps = roadmap.categories.reduce(
    (sum, c) => sum + c.steps.length,
    0,
  );
  const checkedSteps = roadmap.categories.reduce(
    (sum, c) => sum + c.steps.filter((s) => s.checked).length,
    0,
  );
  const pct =
    totalSteps > 0 ? Math.round((checkedSteps / totalSteps) * 100) : 0;

  const date = new Date(roadmap.createdAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div style={{ position: "relative" }}>
      <Corners color="rgba(107,255,143,0.3)" />
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--surface-high)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-3"
          style={{
            borderBottom: "1px solid var(--surface-high)",
            backgroundColor: "var(--surface-high)",
          }}
        >
          <span style={{ color: "#0cce6b", opacity: 0.6, fontSize: "11px" }}>
            {"//"}
          </span>
          <span
            className="text-[10px] tracking-[0.2em] uppercase flex-1 truncate"
            style={{ color: "var(--primary)" }}
          >
            {roadmap.url}
          </span>
          <span
            className="text-[10px] px-2 py-0.5 uppercase tracking-wider"
            style={{
              color: "var(--text-dim)",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--outline)",
            }}
          >
            {roadmap.strategy}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
            {date}
          </span>

          {/* Delete */}
          {!showConfirm ? (
            <button
              className="text-[10px] px-2 py-0.5 uppercase tracking-wider transition-colors"
              style={{
                color: "#ff4e42",
                border: "1px solid rgba(255,78,66,0.3)",
              }}
              onClick={() => setShowConfirm(true)}
            >
              Eliminar
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                className="text-[10px] px-2 py-0.5 uppercase tracking-wider"
                style={{
                  color: "#ff4e42",
                  backgroundColor: "rgba(255,78,66,0.15)",
                  border: "1px solid rgba(255,78,66,0.3)",
                }}
                onClick={() => deleteRoadmap(roadmap.id)}
              >
                Confirmar
              </button>
              <button
                className="text-[10px] px-2 py-0.5 uppercase tracking-wider"
                style={{
                  color: "var(--text-dim)",
                  border: "1px solid var(--outline)",
                }}
                onClick={() => setShowConfirm(false)}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Progress + summary */}
        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div
              className="text-2xl font-black tabular-nums"
              style={{ color: "var(--primary)" }}
            >
              {pct}%
            </div>
            <div className="flex-1">
              <div
                className="text-[10px] tracking-[0.15em] uppercase mb-1.5"
                style={{ color: "var(--text-dim)" }}
              >
                Progreso del roadmap
              </div>
              <ProgressBar checked={checkedSteps} total={totalSteps} />
            </div>
          </div>

          <p
            className="text-xs leading-relaxed"
            style={{
              color: "var(--text-dim)",
              borderLeft: "2px solid var(--primary)",
              paddingLeft: "12px",
            }}
          >
            {roadmap.summary}
          </p>
        </div>

        {/* Categories */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          {roadmap.categories.map((cat) => (
            <CategorySection
              key={cat.category}
              cat={cat}
              roadmapId={roadmap.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Logs() {
  const roadmaps = useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    () => SERVER_SNAPSHOT,
  );

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
        className="flex flex-col min-h-screen px-8 lg:px-16 py-12"
        style={{
          marginLeft: "var(--sidebar-w, 15rem)",
          transition: "margin-left 0.2s ease",
        }}
      >
        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          <h1
            className="text-sm tracking-[0.3em] uppercase font-bold"
            style={{ color: "var(--text)" }}
          >
            Roadmaps
          </h1>
          {roadmaps.length > 0 && (
            <span
              className="text-[10px] px-2 py-0.5 tabular-nums"
              style={{
                color: "var(--primary)",
                backgroundColor: "rgba(107,255,143,0.08)",
                border: "1px solid rgba(107,255,143,0.2)",
              }}
            >
              {roadmaps.length}
            </span>
          )}
        </div>

        {roadmaps.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center flex flex-col items-center gap-4">
              <svg
                className="w-10 h-10"
                style={{ color: "var(--outline)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-dim)" }}
                >
                  No hay roadmaps generados
                </p>
                <p className="text-[10px]" style={{ color: "var(--outline)" }}>
                  Analiza una URL y genera tu primer roadmap con IA
                </p>
              </div>
              <Link
                href="/"
                className="text-[10px] tracking-[0.2em] uppercase px-4 py-2 transition-colors"
                style={{
                  color: "var(--primary)",
                  border: "1px solid var(--primary)",
                }}
              >
                &gt; Ir al análisis
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {roadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap.id} roadmap={roadmap} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
