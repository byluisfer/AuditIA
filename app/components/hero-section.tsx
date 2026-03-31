"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UrlInput } from "./url-input";
import type { LighthouseReport } from "../api/analyze/route";
import { scoreToColor, scoreToLabel } from "../lib/score-utils";
import { findRoadmapByUrlAndStrategy, saveRoadmap } from "../lib/storage";
import { useAppLanguage } from "../lib/app-language";
import type { Roadmap } from "../types/roadmap";

// ── Types ─────────────────────────────────────────────────────────────────────
type ApiStatus = "idle" | "loading" | "done" | "error";
type Strategy = "mobile" | "desktop";
type ViewState = "form" | "terminal" | "results" | "roadmap-loading";
type PostAnalyzeAction =
  | { type: "redirect-existing"; roadmapId: string }
  | { type: "auto-generate" }
  | null;

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
  const language = useAppLanguage();
  const isEn = language === "en";
  const l = (es: string, en: string) => (isEn ? en : es);
  const [visibleCount, setVisibleCount] = useState(0);
  const [finalLine, setFinalLine] = useState<TLine | null>(null);

  let domain = url;
  try {
    domain = new URL(url).hostname;
  } catch {
    /* keep raw url */
  }

  const lines: TLine[] = [
    {
      text: l(
        "Iniciando secuencia de auditoria...",
        "Starting audit sequence...",
      ),
      type: "dim",
    },
    {
      text: l(`Objetivo identificado: ${url}`, `Target identified: ${url}`),
      type: "highlight",
    },
    {
      text: l(`Entrando en ${domain}...`, `Entering ${domain}...`),
      type: "highlight",
    },
    {
      text: l(
        "Iniciando motor de Lighthouse...",
        "Starting Lighthouse engine...",
      ),
      type: "default",
    },
    {
      text: l(
        "Ejecutando diagnosticos de rendimiento...",
        "Running performance diagnostics...",
      ),
      type: "default",
    },
    {
      text: l(
        "Analizando metricas de rendimiento...",
        "Analyzing performance metrics...",
      ),
      type: "default",
    },
    {
      text: l("Datos de rendimiento obtenidos.", "Performance data collected."),
      type: "success",
    },
    {
      text: l(
        "Escaneando arbol de accesibilidad...",
        "Scanning accessibility tree...",
      ),
      type: "default",
    },
    {
      text: l("Comprobando buenas practicas...", "Checking best practices..."),
      type: "default",
    },
    {
      text: l("Obteniendo senales SEO...", "Gathering SEO signals..."),
      type: "default",
    },
    {
      text: l("Compilando informe final...", "Compiling final report..."),
      type: "default",
    },
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
        ? { text: `${isEn ? "Error" : "Error"}: ${errorMsg}`, type: "error" }
        : {
            text: l(
              "Analisis completado. Generando informe...",
              "Analysis complete. Generating report...",
            ),
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
            {l("AUDITIA · MOTOR DE AUDITORIA", "AUDITIA - AUDIT ENGINE")}
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
            {isRunning ? l("EN VIVO", "LIVE") : l("LISTO", "READY")}
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
                {isEn ? "MODE" : "MODO"} {strategy.toUpperCase()}
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
                ? l("ESTADO: ERROR", "STATUS: ERROR")
                : isRunning
                  ? l("ESTADO: EJECUTANDO", "STATUS: RUNNING")
                  : l("ESTADO: COMPLETO", "STATUS: COMPLETE")}
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
                {isEn ? "est. ~60s" : "est. ~60seg"}
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

// ── Roadmap Loader ───────────────────────────────────────────────────────────
const ROADMAP_TIMINGS = [300, 1200, 2500, 5000, 8000, 12000, 16000, 20000];
const ROADMAP_STAMPS = ROADMAP_TIMINGS.map((ms) => {
  const s = ms / 1000;
  return s < 10 ? `+${s.toFixed(1)}s` : `+${Math.round(s)}s`;
});

function RoadmapLoader({
  url,
  status,
  errorMsg,
}: {
  url: string;
  status: "loading" | "error" | "done";
  errorMsg: string;
}) {
  const language = useAppLanguage();
  const isEn = language === "en";
  const l = (es: string, en: string) => (isEn ? en : es);
  const [visibleCount, setVisibleCount] = useState(0);
  const [finalLine, setFinalLine] = useState<TLine | null>(null);

  let domain = url;
  try {
    domain = new URL(url).hostname;
  } catch {
    /* keep raw */
  }

  const roadmapLines: TLine[] = [
    {
      text: l(
        "Iniciando generacion de roadmap...",
        "Starting roadmap generation...",
      ),
      type: "dim",
    },
    {
      text: l("Conectando con motor de IA...", "Connecting to AI engine..."),
      type: "highlight",
    },
    {
      text: l(
        "Enviando informe Lighthouse al modelo...",
        "Sending Lighthouse report to model...",
      ),
      type: "default",
    },
    {
      text: l(
        "Analizando oportunidades de rendimiento...",
        "Analyzing performance opportunities...",
      ),
      type: "default",
    },
    {
      text: l(
        "Evaluando accesibilidad y SEO...",
        "Evaluating accessibility and SEO...",
      ),
      type: "default",
    },
    {
      text: l(
        "Priorizando acciones por impacto...",
        "Prioritizing actions by impact...",
      ),
      type: "default",
    },
    {
      text: l(
        "Generando pasos y soluciones...",
        "Generating steps and solutions...",
      ),
      type: "default",
    },
    {
      text: l(
        "Construyendo checklist de mejoras...",
        "Building improvement checklist...",
      ),
      type: "default",
    },
  ];

  useEffect(() => {
    const timers = roadmapLines.map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), ROADMAP_TIMINGS[i]),
    );
    return () => timers.forEach(clearTimeout);
  }, [roadmapLines]);

  useEffect(() => {
    if (status === "loading") return;

    setVisibleCount(roadmapLines.length);

    const fl: TLine =
      status === "error"
        ? { text: `${isEn ? "Error" : "Error"}: ${errorMsg}`, type: "error" }
        : {
            text: l(
              "Roadmap generado con exito. Redirigiendo...",
              "Roadmap generated successfully. Redirecting...",
            ),
            type: "success",
          };

    const t = setTimeout(() => setFinalLine(fl), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const displayLines = [
    ...roadmapLines.slice(0, visibleCount),
    ...(finalLine ? [finalLine] : []),
  ];
  const isRunning = status === "loading";

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
        {/* Title bar */}
        <div
          className="flex items-center gap-4 px-5 py-3"
          style={{
            borderBottom: "1px solid var(--surface-high)",
            backgroundColor: "var(--surface-high)",
          }}
        >
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

          <span
            className="flex-1 text-center text-xs tracking-[0.25em] uppercase"
            style={{
              color: "var(--text-dim)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {l("AUDITIA · GENERADOR DE ROADMAP", "AUDITIA - ROADMAP GENERATOR")}
          </span>

          <span
            className={isRunning ? "terminal-pulse" : ""}
            style={{
              display: "inline-block",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "9px",
              letterSpacing: "0.14em",
              padding: "2px 7px",
              border: `1px solid ${isRunning ? "var(--primary)" : status === "error" ? "#ff4e42" : "#0cce6b"}`,
              color: isRunning
                ? "var(--primary)"
                : status === "error"
                  ? "#ff4e42"
                  : "#0cce6b",
            }}
          >
            {isRunning
              ? l("PROCESANDO", "PROCESSING")
              : status === "error"
                ? "ERROR"
                : l("LISTO", "READY")}
          </span>
        </div>

        {/* Terminal body */}
        <div
          className="relative overflow-hidden"
          style={{
            padding: "2rem 2.25rem",
            minHeight: "18rem",
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
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(107,255,143,0.04) 0%, transparent 70%)",
              zIndex: 1,
            }}
          />

          <div className="relative" style={{ zIndex: 2 }}>
            {/* Shell prompt */}
            <div
              className="mb-6 pb-5"
              style={{ borderBottom: "1px solid var(--surface-high)" }}
            >
              <div
                className="text-xs mb-3"
                style={{ color: "var(--text-dim)", letterSpacing: "0.05em" }}
              >
                AUDITIA v1.0.0{"  "}·{"  "}
                {l("Roadmap IA", "AI Roadmap")}
                {"  "}·{"  "}OpenRouter
              </div>
              <div
                className="text-xs flex flex-wrap items-baseline gap-1"
                style={{ lineHeight: 1.7 }}
              >
                <span style={{ color: "#0cce6b" }}>root@auditia</span>
                <span style={{ color: "var(--text-dim)" }}>:~#</span>
                <span style={{ color: "var(--text)", marginLeft: "0.25rem" }}>
                  auditia roadmap --generate --url={url}
                </span>
              </div>
            </div>

            {/* Output lines */}
            <div className="flex flex-col gap-2.5">
              {displayLines.map((line, i) => {
                const isLast = i === displayLines.length - 1;
                const hasStamp = i < roadmapLines.length;
                const isFinalLine =
                  finalLine !== null && i === displayLines.length - 1;
                const stamp = hasStamp ? ROADMAP_STAMPS[i] : null;

                return (
                  <div
                    key={i}
                    className="terminal-line-in flex items-baseline gap-0"
                    style={{ fontSize: "0.8125rem" }}
                  >
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

        {/* Status bar */}
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
              {status === "error"
                ? l("ESTADO: ERROR", "STATUS: ERROR")
                : isRunning
                  ? l("ESTADO: GENERANDO", "STATUS: GENERATING")
                  : l("ESTADO: COMPLETO", "STATUS: COMPLETE")}
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
                {l(
                  "Esperando respuesta del modelo...",
                  "Waiting model response...",
                )}
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
  const language = useAppLanguage();
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
          aria-label={`${label}: ${score} ${language === "en" ? "of" : "de"} 100`}
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
        {scoreToLabel(score, language)}
      </span>
    </div>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────────
export function HeroSection() {
  const language = useAppLanguage();
  const isEn = language === "en";
  const l = (es: string, en: string) => (isEn ? en : es);
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("desktop");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [report, setReport] = useState<LighthouseReport | null>(null);
  const [viewState, setViewState] = useState<ViewState>("form");
  const [analysisUrl, setAnalysisUrl] = useState("");
  const [roadmapStatus, setRoadmapStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [roadmapError, setRoadmapError] = useState("");
  const [postAnalyzeAction, setPostAnalyzeAction] =
    useState<PostAnalyzeAction>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const didHandleQueryPrefill = useRef(false);

  async function generateRoadmapFromReport(reportData: LighthouseReport) {
    const existing = findRoadmapByUrlAndStrategy(
      reportData.url,
      reportData.strategy,
      language,
    );
    if (existing) {
      router.push(`/roadmaps?id=${existing.id}`);
      return;
    }

    setRoadmapStatus("loading");
    setRoadmapError("");
    setViewState("roadmap-loading");

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: reportData, language }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRoadmapError(data?.error ?? l("Error desconocido", "Unknown error"));
        setRoadmapStatus("error");
        return;
      }

      const categories = data.categories.map(
        (cat: { steps: Array<Record<string, unknown>> }) => ({
          ...cat,
          steps: cat.steps.map((step: Record<string, unknown>) => ({
            ...step,
            checked: false,
          })),
        }),
      );

      const roadmap: Roadmap = {
        id: crypto.randomUUID(),
        url: reportData.url,
        strategy: reportData.strategy,
        language,
        createdAt: new Date().toISOString(),
        summary: data.summary,
        categories,
        scores: {
          performance: reportData.categories.performance.score,
          accessibility: reportData.categories.accessibility.score,
          seo: reportData.categories.seo.score,
          bestPractices: reportData.categories.bestPractices.score,
        },
      };

      const roadmapId = saveRoadmap(roadmap);
      setRoadmapStatus("done");
      setTimeout(() => router.push(`/roadmaps?id=${roadmapId}`), 1800);
    } catch (err) {
      setRoadmapError(
        err instanceof Error
          ? err.message
          : l("Error desconocido", "Unknown error"),
      );
      setRoadmapStatus("error");
    }
  }

  async function runAnalyze(
    targetUrl: string,
    targetStrategy: Strategy,
    options?: { autoGenerateRoadmap?: boolean },
  ) {
    const trimmed = targetUrl.trim();
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
        body: JSON.stringify({ url: trimmed, strategy: targetStrategy }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error ?? l("Error desconocido", "Unknown error"));
        setApiStatus("error");
        return;
      }

      const parsedReport = data as LighthouseReport;
      const existingRoadmap = findRoadmapByUrlAndStrategy(
        parsedReport.url,
        parsedReport.strategy,
      );

      setReport(parsedReport);
      setRoadmapStatus("idle");
      setRoadmapError("");
      if (existingRoadmap) {
        setPostAnalyzeAction({
          type: "redirect-existing",
          roadmapId: existingRoadmap.id,
        });
      } else if (options?.autoGenerateRoadmap) {
        setPostAnalyzeAction({ type: "auto-generate" });
      } else {
        setPostAnalyzeAction(null);
      }
      setApiStatus("done");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : l("Error desconocido", "Unknown error"),
      );
      setPostAnalyzeAction(null);
      setApiStatus("error");
    }
  }

  useEffect(() => {
    if (didHandleQueryPrefill.current) return;

    const prefillUrl = searchParams.get("url")?.trim();
    if (!prefillUrl) {
      didHandleQueryPrefill.current = true;
      return;
    }

    const rawStrategy = searchParams.get("strategy");
    const prefillStrategy: Strategy =
      rawStrategy === "mobile" ? "mobile" : "desktop";
    const shouldAutorun = searchParams.get("autorun") === "1";
    const shouldAutoGenerateRoadmap = searchParams.get("autogenerate") === "1";

    setUrl(prefillUrl);
    setStrategy(prefillStrategy);
    didHandleQueryPrefill.current = true;

    if (shouldAutorun) {
      void runAnalyze(prefillUrl, prefillStrategy, {
        autoGenerateRoadmap: shouldAutoGenerateRoadmap,
      });
    }
  }, [searchParams]);

  async function handleGenerateRoadmap() {
    if (!report) return;
    await generateRoadmapFromReport(report);
  }

  async function handleAnalyze() {
    await runAnalyze(url, strategy);
  }

  function handleTransitionDone() {
    if (apiStatus === "done") {
      if (postAnalyzeAction?.type === "redirect-existing") {
        router.push(`/roadmaps?id=${postAnalyzeAction.roadmapId}`);
        return;
      }
      if (postAnalyzeAction?.type === "auto-generate" && report) {
        void generateRoadmapFromReport(report);
        return;
      }
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
    setRoadmapStatus("idle");
    setRoadmapError("");
    setPostAnalyzeAction(null);
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
                {l("LISTO", "READY")}
              </span>
            </div>

            <div className="p-8 pb-10">
              <UrlInput value={url} onChange={setUrl} disabled={false} />

              {/* Strategy toggle */}
              <div
                className="flex gap-2 mb-6"
                role="group"
                aria-label={l("Estrategia de analisis", "Analysis strategy")}
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
                      {opt === "mobile"
                        ? l("Movil", "Mobile")
                        : l("Escritorio", "Desktop")}
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
                &gt; {l("Analizar sitio web", "Analyze website")}
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

      {/* ── ROADMAP LOADING VIEW ─────────────────────────────────────────── */}
      {viewState === "roadmap-loading" && report && (
        <RoadmapLoader
          url={report.url}
          status={roadmapStatus as "loading" | "done" | "error"}
          errorMsg={roadmapError}
        />
      )}

      {/* ── RESULTS VIEW ───────────────────────────────────────────────────── */}
      {viewState === "results" && report && (
        <div className="w-full max-w-3xl results-fade-in flex flex-col gap-8">
          {/* Meta bar */}
          <div className="flex items-center justify-between">
            <div
              className="text-[10px] tracking-[0.15em] uppercase"
              style={{
                color: "var(--text-dim)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                opacity: 0.5,
              }}
            >
              {report.url}
              {" · "}
              {report.strategy}
              {" · "}v{report.lighthouseVersion}
              {report.fetchTime && (
                <>
                  {" "}
                  ·{" "}
                  {new Date(report.fetchTime).toLocaleTimeString(
                    isEn ? "en-US" : "es-ES",
                    {
                      hour12: false,
                    },
                  )}
                </>
              )}
            </div>
            <button
              className="text-[10px] px-3 py-1.5 tracking-[0.15em] uppercase transition-all duration-150"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                color: "var(--text-dim)",
                border: "1px solid var(--outline)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--primary)";
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-dim)";
                e.currentTarget.style.borderColor = "var(--outline)";
              }}
              onClick={handleReset}
            >
              ↩ {l("Nuevo analisis", "New analysis")}
            </button>
          </div>

          {/* Score cards */}
          <div style={{ position: "relative" }}>
            <Corners />
            <div
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--outline)",
                borderLeft: "2px solid var(--primary)",
                boxShadow:
                  "0 0 60px rgba(107,255,143,0.04), 0 8px 32px rgba(0,0,0,0.2)",
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
                  className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase"
                  style={{
                    color: "var(--text-dim)",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
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
                  {l("COMPLETO", "COMPLETE")}
                </span>
              </div>

              {/* Gauges */}
              <div className="grid grid-cols-4 gap-0">
                {[
                  {
                    score: report.categories.performance.score,
                    label: l("Rendimiento", "Performance"),
                  },
                  {
                    score: report.categories.accessibility.score,
                    label: l("Accesibilidad", "Accessibility"),
                  },
                  {
                    score: report.categories.bestPractices.score,
                    label: l("Buenas Practicas", "Best Practices"),
                  },
                  { score: report.categories.seo.score, label: "SEO" },
                ].map(({ score, label }, i, arr) => (
                  <div
                    key={label}
                    className="flex flex-col items-center py-10 px-4"
                    style={{
                      borderRight:
                        i < arr.length - 1
                          ? "1px solid var(--surface-high)"
                          : "none",
                    }}
                  >
                    <ScoreGauge score={score} label={label} />
                  </div>
                ))}
              </div>

              {/* Overall score bar */}
              <div
                className="px-8 py-4 flex items-center gap-4"
                style={{ borderTop: "1px solid var(--surface-high)" }}
              >
                {(() => {
                  const avg = Math.round(
                    (report.categories.performance.score +
                      report.categories.accessibility.score +
                      report.categories.bestPractices.score +
                      report.categories.seo.score) /
                      4,
                  );
                  const color = scoreToColor(avg);
                  return (
                    <>
                      <span
                        className="text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          color: "var(--text-dim)",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          opacity: 0.5,
                        }}
                      >
                        {l("Puntuacion global", "Overall score")}
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{ backgroundColor: "var(--surface-high)" }}
                      />
                      <span
                        className="text-2xl font-black"
                        style={{
                          color,
                          fontFamily: "var(--font-space-grotesk), sans-serif",
                          textShadow: `0 0 20px ${color}88`,
                        }}
                      >
                        {avg}
                      </span>
                      <span
                        className="text-[10px] tracking-[0.2em] uppercase font-bold"
                        style={{
                          color,
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}
                      >
                        {scoreToLabel(avg, language)}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Generate roadmap CTA */}
          {(() => {
            const existingRoadmap = report
              ? findRoadmapByUrlAndStrategy(report.url, report.strategy)
              : null;
            const alreadyExists = !!existingRoadmap;
            return (
              <div style={{ position: "relative" }}>
                <Corners color="rgba(107,255,143,0.3)" />
                <div
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--surface-high)",
                    borderLeft: alreadyExists
                      ? "2px solid #0cce6b"
                      : "2px solid var(--primary)",
                  }}
                >
                  {/* Card header */}
                  <div
                    className="flex items-center justify-between px-6 py-3"
                    style={{
                      borderBottom: "1px solid var(--surface-high)",
                      backgroundColor: "var(--surface-high)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          color: "#0cce6b",
                          opacity: 0.6,
                          fontSize: "11px",
                        }}
                      >
                        {"//"}
                      </span>
                      <span
                        className="text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          color: alreadyExists ? "#0cce6b" : "var(--primary)",
                        }}
                      >
                        {alreadyExists
                          ? l("Roadmap activo", "Active roadmap")
                          : l("Siguiente paso", "Next step")}
                      </span>
                    </div>
                    {existingRoadmap && (
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
                        {l("EXISTENTE", "EXISTING")}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-6 flex flex-col gap-5">
                    {existingRoadmap ? (
                      <>
                        {/* Progress summary */}
                        {(() => {
                          const totalSteps = existingRoadmap.categories.reduce(
                            (sum, cat) => sum + cat.steps.length,
                            0,
                          );
                          const doneSteps = existingRoadmap.categories.reduce(
                            (sum, cat) =>
                              sum + cat.steps.filter((s) => s.checked).length,
                            0,
                          );
                          const pct =
                            totalSteps > 0
                              ? Math.round((doneSteps / totalSteps) * 100)
                              : 0;
                          return (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-xs"
                                  style={{
                                    color: "var(--text-dim)",
                                    fontFamily:
                                      "var(--font-jetbrains-mono), monospace",
                                  }}
                                >
                                  {l(
                                    "Progreso del roadmap",
                                    "Roadmap progress",
                                  )}
                                </span>
                                <span
                                  className="text-xs font-bold"
                                  style={{
                                    color:
                                      pct === 100 ? "#0cce6b" : "var(--text)",
                                    fontFamily:
                                      "var(--font-jetbrains-mono), monospace",
                                  }}
                                >
                                  {doneSteps}/{totalSteps} {l("pasos", "steps")}{" "}
                                  · {pct}%
                                </span>
                              </div>
                              <div
                                className="w-full h-1.5 overflow-hidden"
                                style={{
                                  backgroundColor: "var(--surface-high)",
                                  borderRadius: "1px",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    backgroundColor: "#0cce6b",
                                    transition: "width 0.3s ease",
                                    boxShadow: "0 0 8px rgba(12,206,107,0.4)",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Roadmap summary */}
                        <div
                          className="text-xs leading-relaxed px-3 py-2.5"
                          style={{
                            color: "var(--text-dim)",
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            borderLeft: "2px solid rgba(12,206,107,0.3)",
                            backgroundColor: "rgba(12,206,107,0.04)",
                          }}
                        >
                          {existingRoadmap.summary.length > 180
                            ? existingRoadmap.summary.slice(0, 180) + "…"
                            : existingRoadmap.summary}
                        </div>

                        {/* Created date */}
                        <div
                          className="text-[10px]"
                          style={{
                            color: "var(--text-dim)",
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            opacity: 0.5,
                          }}
                        >
                          {l("Creado el", "Created on")}{" "}
                          {new Date(
                            existingRoadmap.createdAt,
                          ).toLocaleDateString(isEn ? "en-US" : "es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>

                        <button
                          className="w-full flex items-center justify-center gap-3 py-4 text-sm tracking-[0.25em] font-black uppercase transition-all duration-150 active:brightness-90"
                          style={{
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            backgroundColor: "var(--surface-high)",
                            color: "#0cce6b",
                            border: "1px solid #0cce6b",
                          }}
                          onClick={() =>
                            router.push(`/roadmaps?id=${existingRoadmap.id}`)
                          }
                          onMouseEnter={(e) => {
                            e.currentTarget.style.filter = "brightness(0.92)";
                          }}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.filter = "")
                          }
                        >
                          &gt; {l("Continuar roadmap", "Continue roadmap")}
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          <div
                            className="text-sm font-bold mb-1.5"
                            style={{
                              color: "var(--text)",
                              fontFamily:
                                "var(--font-jetbrains-mono), monospace",
                            }}
                          >
                            {l(
                              "Genera un roadmap con IA",
                              "Generate an AI roadmap",
                            )}
                          </div>
                          <div
                            className="text-xs leading-relaxed"
                            style={{
                              color: "var(--text-dim)",
                              fontFamily:
                                "var(--font-jetbrains-mono), monospace",
                            }}
                          >
                            {l(
                              "Convierte los errores de Lighthouse en un plan de accion priorizado para alcanzar 100 en las 4 categorias.",
                              "Turn Lighthouse issues into a prioritized action plan to reach 100 in all 4 categories.",
                            )}
                          </div>
                        </div>

                        <button
                          className="w-full flex items-center justify-center gap-3 py-4 text-sm tracking-[0.25em] font-black uppercase transition-all duration-150 active:brightness-90"
                          style={{
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            backgroundColor:
                              roadmapStatus === "loading"
                                ? "var(--surface-high)"
                                : "var(--primary)",
                            color:
                              roadmapStatus === "loading"
                                ? "var(--primary)"
                                : "var(--primary-on)",
                            boxShadow:
                              roadmapStatus === "loading"
                                ? "none"
                                : "0 0 36px rgba(107,255,143,0.18), 0 4px 16px rgba(0,0,0,0.25)",
                          }}
                          disabled={roadmapStatus === "loading"}
                          onClick={handleGenerateRoadmap}
                          onMouseEnter={(e) => {
                            if (roadmapStatus !== "loading")
                              e.currentTarget.style.filter = "brightness(0.88)";
                          }}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.filter = "")
                          }
                        >
                          {roadmapStatus === "loading" ? (
                            <>
                              <span className="terminal-pulse">&gt;</span>
                              {l(
                                "Generando roadmap...",
                                "Generating roadmap...",
                              )}
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                                />
                              </svg>
                              &gt; {l("Generar roadmap", "Generate roadmap")}
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {roadmapError && (
                      <div
                        className="text-xs mt-3 px-3 py-2"
                        style={{
                          color: "#ff4e42",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          backgroundColor: "rgba(255,78,66,0.08)",
                          border: "1px solid rgba(255,78,66,0.2)",
                        }}
                      >
                        {l("Error", "Error")}: {roadmapError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </main>
  );
}
