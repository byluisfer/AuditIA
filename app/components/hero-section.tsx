"use client";
import { useState, useEffect } from "react";
import { UrlInput } from "./url-input";
import type {
  LighthouseReport,
  AuditResult,
  CategoryReport,
} from "../api/analyze/route";

// ── Types ─────────────────────────────────────────────────────────────────────
type ApiStatus = "idle" | "loading" | "done" | "error";
type Strategy = "mobile" | "desktop";
type ViewState = "form" | "terminal" | "results";

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreToColor(score: number | null): string {
  if (score === null) return "var(--text-dim)";
  if (score >= 90) return "#0cce6b";
  if (score >= 50) return "#ffa400";
  return "#ff4e42";
}
function scoreToLabel(score: number): string {
  if (score >= 90) return "ÓPTIMO";
  if (score >= 50) return "REGULAR";
  return "CRÍTICO";
}
const METRIC_LABELS: Record<string, string> = {
  "first-contentful-paint": "Primera Pintura con Contenido",
  "largest-contentful-paint": "Mayor Pintura con Contenido",
  "total-blocking-time": "Tiempo Total de Bloqueo",
  "cumulative-layout-shift": "Desplazamiento Acumulativo",
  "speed-index": "Índice de Velocidad",
  interactive: "Tiempo hasta Interactivo",
};

// ── HUD corner marks ──────────────────────────────────────────────────────────
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

// ── Icons ─────────────────────────────────────────────────────────────────────
function MobileIcon() {
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
function DesktopIcon() {
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

// ── Terminal Loader ───────────────────────────────────────────────────────────
type TLineType = "default" | "highlight" | "success" | "dim" | "error";
interface TLine {
  text: string;
  type?: TLineType;
}

const LINE_TIMINGS = [
  400, // Iniciando secuencia
  1400, // Objetivo identificado
  3000, // Entrando al dominio
  5200, // Iniciando Lighthouse
  8500, // Performance diagnostics
  14000, // Analysing metrics
  20000, // Rendimiento obtenido
  26000, // Accesibilidad
  32000, // Best practices
  38000, // SEO signals
  44000, // Compilando informe
];

// Pre-format timestamps from timings
const LINE_STAMPS = LINE_TIMINGS.map((ms) => {
  const s = ms / 1000;
  return s < 10 ? `+${s.toFixed(1)}s` : `+${Math.round(s)}s`;
});

function tLineColor(type?: TLineType): string {
  switch (type) {
    case "success":
      return "#0cce6b";
    case "highlight":
      return "var(--primary)";
    case "dim":
      return "var(--text-dim)";
    case "error":
      return "#ff4e42";
    default:
      return "var(--text)";
  }
}

function tLineGlow(type?: TLineType): string {
  switch (type) {
    case "success":
      return "0 0 10px rgba(12,206,107,0.55)";
    case "highlight":
      return "0 0 10px rgba(107,255,143,0.4)";
    default:
      return "none";
  }
}

function TerminalLoader({
  url,
  strategy,
  apiStatus,
  errorMsg,
  onTransitionDone,
}: {
  url: string;
  strategy: Strategy;
  apiStatus: ApiStatus;
  errorMsg: string;
  onTransitionDone: () => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [finalLine, setFinalLine] = useState<TLine | null>(null);

  let domain = url;
  try {
    domain = new URL(url).hostname;
  } catch {
    /* keep raw url */
  }

  const lines: TLine[] = [
    { text: "Iniciando secuencia de auditoría...", type: "dim" },
    { text: `Objetivo identificado: ${url}`, type: "highlight" },
    { text: `Entrando en ${domain}...`, type: "highlight" },
    { text: "Iniciando motor de Lighthouse...", type: "default" },
    { text: "Ejecutando diagnósticos de rendimiento...", type: "default" },
    { text: "Analizando métricas de rendimiento...", type: "default" },
    { text: "Datos de rendimiento obtenidos.", type: "success" },
    { text: "Escaneando árbol de accesibilidad...", type: "default" },
    { text: "Comprobando buenas prácticas...", type: "default" },
    { text: "Obteniendo señales SEO...", type: "default" },
    { text: "Compilando informe final...", type: "default" },
  ];

  useEffect(() => {
    const timers = lines.map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), LINE_TIMINGS[i]),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (apiStatus !== "done" && apiStatus !== "error") return;

    setVisibleCount(lines.length);

    const fl: TLine =
      apiStatus === "error"
        ? { text: `Error: ${errorMsg}`, type: "error" }
        : {
            text: "Análisis completado. Generando informe...",
            type: "success",
          };

    const t1 = setTimeout(() => setFinalLine(fl), 500);
    const t2 = setTimeout(onTransitionDone, 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiStatus]);

  const displayLines = [
    ...lines.slice(0, visibleCount),
    ...(finalLine ? [finalLine] : []),
  ];
  const isRunning = apiStatus === "loading";
  const command = `lighthouse --strategy=${strategy} --output=json --quiet ${url}`;

  return (
    <div
      className="w-full max-w-3xl results-fade-in"
      style={{ position: "relative" }}
    >
      <Corners />

      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--primary)",
          boxShadow:
            "0 0 0 1px rgba(107,255,143,0.08)," +
            "0 0 80px rgba(107,255,143,0.05)," +
            "0 16px 48px rgba(0,0,0,0.4)",
        }}
      >
        {/* ── Title bar ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-4 px-5 py-3"
          style={{
            borderBottom: "1px solid var(--surface-high)",
            backgroundColor: "var(--surface-high)",
          }}
        >
          {/* Traffic lights */}
          <div className="flex gap-1.5 shrink-0">
            {(["#ff5f57", "#febc2e", "#28c840"] as const).map((c, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  backgroundColor: c,
                }}
              />
            ))}
          </div>

          {/* Title */}
          <span
            className="flex-1 text-center text-xs tracking-[0.25em] uppercase"
            style={{
              color: "var(--text-dim)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            AUDITIA · MOTOR DE AUDITORÍA
          </span>

          {/* Status badge — no hard blink, smooth pulse only when live */}
          <span
            className={isRunning ? "terminal-pulse" : ""}
            style={{
              display: "inline-block",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "9px",
              letterSpacing: "0.14em",
              padding: "2px 7px",
              border: `1px solid ${isRunning ? "var(--primary)" : "#0cce6b"}`,
              color: isRunning ? "var(--primary)" : "#0cce6b",
            }}
          >
            {isRunning ? "EN VIVO" : "LISTO"}
          </span>
        </div>

        {/* ── Terminal body ───────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{
            padding: "2rem 2.25rem",
            minHeight: "22rem",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent, transparent 3px, var(--scanline-color) 3px, var(--scanline-color) 4px)",
              zIndex: 1,
            }}
          />
          {/* Phosphor green radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(107,255,143,0.04) 0%, transparent 70%)",
              zIndex: 1,
            }}
          />

          <div className="relative" style={{ zIndex: 2 }}>
            {/* Shell prompt + command */}
            <div
              className="mb-6 pb-5"
              style={{ borderBottom: "1px solid var(--surface-high)" }}
            >
              <div
                className="text-xs mb-3"
                style={{ color: "var(--text-dim)", letterSpacing: "0.05em" }}
              >
                AUDITIA v1.0.0{"  "}·{"  "}Google Lighthouse{"  "}·{"  "}
                MODO {strategy.toUpperCase()}
              </div>
              {/* Actual shell command */}
              <div
                className="text-xs flex flex-wrap items-baseline gap-1"
                style={{ lineHeight: 1.7 }}
              >
                <span style={{ color: "#0cce6b" }}>root@auditia</span>
                <span style={{ color: "var(--text-dim)" }}>:~#</span>
                <span style={{ color: "var(--text)", marginLeft: "0.25rem" }}>
                  {command}
                </span>
              </div>
            </div>

            {/* Output lines */}
            <div className="flex flex-col gap-2.5">
              {displayLines.map((line, i) => {
                const isLast = i === displayLines.length - 1;
                const hasStamp = i < lines.length; // finalLine has no pre-set stamp
                const isFinalLine =
                  finalLine !== null && i === displayLines.length - 1;
                const stamp = hasStamp ? LINE_STAMPS[i] : null;

                return (
                  <div
                    key={i}
                    className="terminal-line-in flex items-baseline gap-0"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {/* Timestamp */}
                    <span
                      style={{
                        color: "var(--text-dim)",
                        opacity: 0.5,
                        minWidth: "4rem",
                        fontSize: "0.7rem",
                        letterSpacing: "0.03em",
                        flexShrink: 0,
                        paddingRight: "0.75rem",
                      }}
                    >
                      {stamp ?? ""}
                    </span>

                    {/* Prompt char */}
                    <span
                      style={{
                        color: "var(--text-dim)",
                        marginRight: "0.5rem",
                        flexShrink: 0,
                        opacity: 0.6,
                      }}
                    >
                      {isFinalLine ? (line.type === "error" ? "✗" : "✓") : "›"}
                    </span>

                    {/* Line text */}
                    <span
                      style={{
                        color: tLineColor(line.type),
                        textShadow: tLineGlow(line.type),
                        flex: 1,
                      }}
                    >
                      {line.text}
                      {isLast && !finalLine && (
                        <span
                          className="cursor-blink inline-block ml-1.5 translate-y-[0.1em]"
                          style={{
                            width: "0.5em",
                            height: "0.88em",
                            backgroundColor: tLineColor(line.type),
                            display: "inline-block",
                          }}
                        />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Status bar ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{
            borderTop: "1px solid var(--surface-high)",
            backgroundColor: "var(--surface-high)",
          }}
        >
          <div className="flex items-center gap-4">
            <span
              style={{
                color: "var(--text-dim)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "10px",
                letterSpacing: "0.1em",
              }}
            >
              {apiStatus === "error"
                ? "ESTADO: ERROR"
                : isRunning
                  ? "ESTADO: EJECUTANDO"
                  : "ESTADO: COMPLETO"}
            </span>
            {isRunning && (
              <span
                style={{
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "10px",
                  opacity: 0.5,
                }}
              >
                est. ~60seg
              </span>
            )}
          </div>
          <span
            style={{
              color: "var(--text-dim)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              opacity: 0.6,
            }}
          >
            {domain}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Score Gauge ───────────────────────────────────────────────────────────────
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = scoreToColor(score);
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--surface-high)"
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={`${(score / 100) * circ} ${circ}`}
            strokeLinecap="round"
            style={{
              transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)",
              filter: `drop-shadow(0 0 5px ${color}88)`,
            }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-2xl font-black"
          style={{ color, fontFamily: "var(--font-space-grotesk), sans-serif" }}
          aria-label={`${label}: ${score} de 100`}
        >
          {score}
        </span>
      </div>
      <span
        className="text-[10px] tracking-widest uppercase text-center leading-tight"
        style={{
          color: "var(--text-dim)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {label}
      </span>
      <span
        className="text-[10px] tracking-widest font-bold"
        style={{ color, fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        {scoreToLabel(score)}
      </span>
    </div>
  );
}

// ── Metrics Grid ──────────────────────────────────────────────────────────────
function MetricsGrid({ metrics }: { metrics: AuditResult[] }) {
  if (!metrics.length) return null;
  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {metrics.map((m) => {
        const color = scoreToColor(
          m.score !== null ? Math.round(m.score * 100) : null,
        );
        return (
          <div
            key={m.id}
            className="p-3"
            style={{ backgroundColor: "var(--surface-high)" }}
          >
            <div
              className="text-xs mb-1"
              style={{
                color: "var(--text-dim)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              {METRIC_LABELS[m.id] ?? m.id}
            </div>
            <div
              className="text-base font-black"
              style={{
                color,
                fontFamily: "var(--font-space-grotesk), sans-serif",
              }}
            >
              {m.displayValue ?? "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Audit Item ────────────────────────────────────────────────────────────────
function AuditItem({
  audit,
  showSavings,
}: {
  audit: AuditResult;
  showSavings?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = audit.score !== null ? Math.round(audit.score * 100) : null;
  const color = scoreToColor(score);
  const plainDesc = audit.description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  return (
    <div style={{ borderBottom: "1px solid var(--surface-high)" }}>
      <button
        className="w-full flex items-start gap-3 py-3 text-left"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        <span
          className="shrink-0 w-2.5 h-2.5 rounded-full mt-1"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm"
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              {audit.title}
            </span>
            {audit.displayValue && (
              <span className="text-xs" style={{ color }}>
                {audit.displayValue}
              </span>
            )}
            {showSavings && audit.savingsMs && audit.savingsMs > 0 && (
              <span
                className="text-xs px-1.5 py-0.5"
                style={{
                  backgroundColor: "var(--surface-high)",
                  color: "#ffa400",
                }}
              >
                −{(audit.savingsMs / 1000).toFixed(2)}s
              </span>
            )}
          </div>
          {expanded && (
            <p
              className="text-xs mt-2 leading-relaxed"
              style={{
                color: "var(--text-dim)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              {plainDesc}
              {audit.warnings?.map((w, i) => (
                <span
                  key={i}
                  className="block mt-1"
                  style={{ color: "#ffa400" }}
                >
                  ⚠ {w}
                </span>
              ))}
            </p>
          )}
        </div>
        <span
          className="text-xs shrink-0 mt-0.5"
          style={{
            color: "var(--text-dim)",
            display: "inline-block",
            transform: expanded ? "rotate(180deg)" : undefined,
            transition: "transform 0.15s",
          }}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
    </div>
  );
}

// ── Category Section ──────────────────────────────────────────────────────────
function CategorySection({ category }: { category: CategoryReport }) {
  const [passedExpanded, setPassedExpanded] = useState(false);
  const color = scoreToColor(category.score);

  return (
    <div className="mb-8">
      <div
        className="flex items-center gap-3 mb-4 pb-2"
        style={{ borderBottom: "1px solid var(--primary)" }}
      >
        <span
          className="text-xl font-black"
          style={{
            color,
            fontFamily: "var(--font-space-grotesk), sans-serif",
            minWidth: "2.5rem",
          }}
        >
          {category.score}
        </span>
        <span
          className="text-sm tracking-[0.15em] uppercase font-bold"
          style={{
            color: "var(--heading)",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          {category.title}
        </span>
        <span
          className="ml-auto text-xs tracking-widest uppercase"
          style={{ color }}
        >
          {scoreToLabel(category.score)}
        </span>
      </div>

      {category.metrics.length > 0 && (
        <MetricsGrid metrics={category.metrics} />
      )}

      {category.opportunities.length > 0 && (
        <div className="mb-4">
          <div
            className="text-xs tracking-[0.2em] uppercase mb-2"
            style={{
              color: "#ffa400",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            Oportunidades
          </div>
          {category.opportunities.map((a) => (
            <AuditItem key={a.id} audit={a} showSavings />
          ))}
        </div>
      )}

      {category.diagnostics.length > 0 && (
        <div className="mb-4">
          <div
            className="text-xs tracking-[0.2em] uppercase mb-2"
            style={{
              color: "#ff4e42",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            Diagnósticos
          </div>
          {category.diagnostics.map((a) => (
            <AuditItem key={a.id} audit={a} />
          ))}
        </div>
      )}

      {category.passed.length > 0 && (
        <div>
          <button
            className="text-xs tracking-[0.2em] uppercase mb-2 flex items-center gap-2"
            style={{
              color: "#0cce6b",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
            onClick={() => setPassedExpanded((p) => !p)}
            aria-expanded={passedExpanded}
          >
            <span
              style={{
                display: "inline-block",
                transform: passedExpanded ? "rotate(90deg)" : undefined,
                transition: "transform 0.15s",
              }}
              aria-hidden="true"
            >
              ▶
            </span>
            {category.passed.length} auditorías aprobadas
          </button>
          {passedExpanded &&
            category.passed.map((a) => <AuditItem key={a.id} audit={a} />)}
        </div>
      )}
    </div>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────────
export function HeroSection() {
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("desktop");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [report, setReport] = useState<LighthouseReport | null>(null);
  const [viewState, setViewState] = useState<ViewState>("form");
  const [analysisUrl, setAnalysisUrl] = useState("");

  async function handleAnalyze() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setAnalysisUrl(trimmed);
    setReport(null);
    setErrorMessage("");
    setApiStatus("loading");
    setViewState("terminal");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, strategy }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error ?? "Error desconocido");
        setApiStatus("error");
        return;
      }

      setReport(data as LighthouseReport);
      setApiStatus("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
      setApiStatus("error");
    }
  }

  function handleTransitionDone() {
    if (apiStatus === "done") {
      setViewState("results");
    } else {
      setApiStatus("idle");
      setViewState("form");
    }
  }

  function handleReset() {
    setViewState("form");
    setReport(null);
    setApiStatus("idle");
    setErrorMessage("");
    setUrl("");
  }

  return (
    <main
      className="relative z-20 flex flex-col items-center justify-center min-h-screen px-12 lg:px-24"
      style={{
        marginLeft: "var(--sidebar-w, 15rem)",
        transition: "margin-left 0.2s ease",
        backgroundColor: "var(--bg)",
      }}
    >
      {/* ── FORM VIEW ──────────────────────────────────────────────────────── */}
      {viewState === "form" && (
        <div
          className="w-full max-w-2xl results-fade-in"
          style={{ position: "relative" }}
        >
          <Corners />

          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--outline)",
              borderLeft: "2px solid var(--primary)",
              boxShadow:
                "0 0 60px rgba(107,255,143,0.04)," +
                "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{
                borderBottom: "1px solid var(--surface-high)",
                backgroundColor: "var(--surface-high)",
              }}
            >
              <div
                className="flex items-center gap-3 text-xs"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  color: "var(--text-dim)",
                  letterSpacing: "0.12em",
                }}
              >
                <span style={{ color: "#0cce6b", opacity: 0.7 }}>{"//"}</span>
                <span style={{ color: "#0cce6b" }}>root@auditia</span>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "9px",
                  letterSpacing: "0.14em",
                  padding: "2px 7px",
                  border: "1px solid #0cce6b",
                  color: "#0cce6b",
                }}
              >
                LISTO
              </span>
            </div>

            <div className="p-8 pb-10">
              <UrlInput value={url} onChange={setUrl} disabled={false} />

              {/* Strategy toggle */}
              <div
                className="flex gap-2 mb-6"
                role="group"
                aria-label="Estrategia de análisis"
              >
                {(["desktop", "mobile"] as Strategy[]).map((opt) => {
                  const isActive = strategy === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setStrategy(opt)}
                      aria-pressed={isActive}
                      className="flex-1 py-3 text-xs tracking-[0.2em] font-bold uppercase flex items-center justify-center gap-2 transition-all duration-150"
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        backgroundColor: isActive
                          ? "var(--primary)"
                          : "var(--surface-high)",
                        color: isActive
                          ? "var(--primary-on)"
                          : "var(--text-dim)",
                        border: isActive
                          ? "1px solid transparent"
                          : "1px solid var(--outline)",
                        boxShadow: isActive
                          ? "0 0 24px rgba(107,255,143,0.2), inset 0 0 12px rgba(107,255,143,0.05)"
                          : "none",
                      }}
                    >
                      {opt === "mobile" ? <MobileIcon /> : <DesktopIcon />}
                      {opt === "mobile" ? "Móvil" : "Escritorio"}
                    </button>
                  );
                })}
              </div>

              {/* Analyze button */}
              <button
                className="w-full py-5 text-sm tracking-[0.3em] font-black uppercase transition-all duration-150 active:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-on)",
                  boxShadow: url.trim()
                    ? "0 0 36px rgba(107,255,143,0.22), 0 4px 16px rgba(0,0,0,0.25)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (url.trim())
                    e.currentTarget.style.filter = "brightness(0.88)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "";
                }}
                onClick={handleAnalyze}
                disabled={!url.trim()}
              >
                &gt; Analizar sitio web
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TERMINAL VIEW ──────────────────────────────────────────────────── */}
      {viewState === "terminal" && (
        <TerminalLoader
          url={analysisUrl}
          strategy={strategy}
          apiStatus={apiStatus}
          errorMsg={errorMessage}
          onTransitionDone={handleTransitionDone}
        />
      )}

      {/* ── RESULTS VIEW ───────────────────────────────────────────────────── */}
      {viewState === "results" && report && (
        <div className="w-full max-w-2xl results-fade-in">
          {/* Results meta + reset */}
          <div className="flex items-center justify-between mb-6">
            <div
              className="text-xs"
              style={{
                color: "var(--text-dim)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              {report.url}
              {" · "}
              {report.strategy}
              {" · "}v{report.lighthouseVersion}
              {report.fetchTime && (
                <> · {new Date(report.fetchTime).toLocaleTimeString()}</>
              )}
            </div>
            <button
              className="text-xs px-3 py-1.5 tracking-[0.15em] uppercase transition-all duration-150"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                color: "var(--primary)",
                border: "1px solid var(--primary)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary)";
                e.currentTarget.style.color = "var(--primary-on)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--primary)";
              }}
              onClick={handleReset}
            >
              ↩ Nuevo análisis
            </button>
          </div>

          {/* Score gauges */}
          <div style={{ position: "relative" }}>
            <Corners />
            <div
              className="grid grid-cols-4 gap-4 p-8 mb-6"
              style={{
                backgroundColor: "var(--surface)",
                borderLeft: "2px solid var(--primary)",
                border: "1px solid var(--outline)",
                borderLeftWidth: 2,
                borderLeftColor: "var(--primary)",
                boxShadow: "0 0 40px rgba(107,255,143,0.04)",
              }}
            >
              <ScoreGauge
                score={report.categories.performance.score}
                label="Rendimiento"
              />
              <ScoreGauge
                score={report.categories.accessibility.score}
                label="Accesibilidad"
              />
              <ScoreGauge
                score={report.categories.bestPractices.score}
                label="Buenas Prácticas"
              />
              <ScoreGauge score={report.categories.seo.score} label="SEO" />
            </div>
          </div>

          {/* Detailed audits */}
          <div
            className="p-8"
            style={{
              backgroundColor: "var(--surface)",
              borderLeft: "2px solid var(--secondary)",
            }}
          >
            <CategorySection category={report.categories.performance} />
            <CategorySection category={report.categories.accessibility} />
            <CategorySection category={report.categories.bestPractices} />
            <CategorySection category={report.categories.seo} />
          </div>
        </div>
      )}
    </main>
  );
}
