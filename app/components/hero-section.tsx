"use client";
import { useState } from "react";
import { UrlInput } from "./url-input";
import type {
  LighthouseReport,
  AuditResult,
  CategoryReport,
} from "../api/analyze/route";

// Types
type AnalysisStatus = "idle" | "loading" | "done" | "error";
type Strategy = "mobile" | "desktop";

// Score helpers
function scoreToColor(score: number | null): string {
  if (score === null) return "var(--text-dim)";
  if (score >= 90) return "#0cce6b";
  if (score >= 50) return "#ffa400";
  return "#ff4e42";
}
function scoreToLabel(score: number): string {
  if (score >= 90) return "PASS";
  if (score >= 50) return "AVERAGE";
  return "FAIL";
}

// Metric helpers
const METRIC_DISPLAY_NAMES: Record<string, string> = {
  "first-contentful-paint": "First Contentful Paint",
  "largest-contentful-paint": "Largest Contentful Paint",
  "total-blocking-time": "Total Blocking Time",
  "cumulative-layout-shift": "Cumulative Layout Shift",
  "speed-index": "Speed Index",
  interactive: "Time to Interactive",
};

// Sub-components
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = scoreToColor(score);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const filledArc = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--surface-high)"
            strokeWidth="8"
          />
          {/* Score arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${filledArc} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-2xl font-black"
          style={{ color, fontFamily: "var(--font-space-grotesk), sans-serif" }}
          aria-label={`${label}: ${score} out of 100`}
        >
          {score}
        </span>
      </div>
      <span
        className="text-xs tracking-widest uppercase text-center leading-tight"
        style={{
          color: "var(--text)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {label}
      </span>
    </div>
  );
}
function MetricsGrid({ metrics }: { metrics: AuditResult[] }) {
  if (!metrics.length) return null;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {metrics.map((metric) => {
        const color = scoreToColor(
          metric.score !== null ? Math.round(metric.score * 100) : null,
        );
        return (
          <div
            key={metric.id}
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
              {METRIC_DISPLAY_NAMES[metric.id] ?? metric.id}
            </div>
            <div
              className="text-lg font-black"
              style={{
                color,
                fontFamily: "var(--font-space-grotesk), sans-serif",
              }}
            >
              {metric.displayValue ?? "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function AuditItem({
  audit,
  showSavings,
}: {
  audit: AuditResult;
  showSavings?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const score = audit.score !== null ? Math.round(audit.score * 100) : null;
  const color = scoreToColor(score);

  // Strip markdown links from descriptions (e.g. "[text](url)" → "text")
  const plainDescription = audit.description.replace(
    /\[([^\]]+)\]\([^)]+\)/g,
    "$1",
  );

  return (
    <div style={{ borderBottom: "1px solid var(--surface-high)" }}>
      <button
        className="w-full flex items-start gap-3 py-3 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        {/* Color-coded score dot */}
        <span
          className="shrink-0 w-3 h-3 rounded-full"
          style={{ backgroundColor: color, marginTop: "4px" }}
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
                −{(audit.savingsMs / 1000).toFixed(2)} s
              </span>
            )}
          </div>

          {isExpanded && (
            <p
              className="text-xs mt-2 leading-relaxed"
              style={{
                color: "var(--text-dim)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              {plainDescription}
              {audit.warnings?.map((warning, index) => (
                <span
                  key={index}
                  className="block mt-1"
                  style={{ color: "#ffa400" }}
                >
                  ⚠ {warning}
                </span>
              ))}
            </p>
          )}
        </div>

        <span
          className="text-xs shrink-0"
          style={{
            color: "var(--text-dim)",
            marginTop: "2px",
            display: "inline-block",
            transform: isExpanded ? "rotate(180deg)" : undefined,
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
function CategorySection({ category }: { category: CategoryReport }) {
  const [passedExpanded, setPassedExpanded] = useState(false);
  const color = scoreToColor(category.score);

  return (
    <div className="mb-8">
      {/* Category header row */}
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

      {/* Performance metrics (only present for the Performance category) */}
      {category.metrics.length > 0 && (
        <MetricsGrid metrics={category.metrics} />
      )}

      {/* Opportunities — audits with estimated time/byte savings */}
      {category.opportunities.length > 0 && (
        <div className="mb-4">
          <div
            className="text-xs tracking-[0.2em] uppercase mb-2"
            style={{
              color: "#ffa400",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            Opportunities
          </div>
          {category.opportunities.map((audit) => (
            <AuditItem key={audit.id} audit={audit} showSavings />
          ))}
        </div>
      )}

      {/* Diagnostics — other failing audits */}
      {category.diagnostics.length > 0 && (
        <div className="mb-4">
          <div
            className="text-xs tracking-[0.2em] uppercase mb-2"
            style={{
              color: "#ff4e42",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            Diagnostics
          </div>
          {category.diagnostics.map((audit) => (
            <AuditItem key={audit.id} audit={audit} />
          ))}
        </div>
      )}

      {/* Passed audits — collapsed by default to keep the report scannable */}
      {category.passed.length > 0 && (
        <div>
          <button
            className="text-xs tracking-[0.2em] uppercase mb-2 flex items-center gap-2"
            style={{
              color: "#0cce6b",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
            onClick={() => setPassedExpanded((prev) => !prev)}
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
            {category.passed.length} passed audits
          </button>

          {passedExpanded &&
            category.passed.map((audit) => (
              <AuditItem key={audit.id} audit={audit} />
            ))}
        </div>
      )}
    </div>
  );
}

// Strategy toggle icons
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

export function HeroSection() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<LighthouseReport | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("mobile");

  const isRunning = analysisStatus === "loading";

  async function handleAnalyze() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setReport(null);
    setErrorMessage("");
    setAnalysisStatus("loading");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl, strategy }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unknown error");
        setAnalysisStatus("error");
        return;
      }

      setReport(data as LighthouseReport);
      setAnalysisStatus("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      setAnalysisStatus("error");
    }
  }

  // Render
  const STATUS_MESSAGES: Record<AnalysisStatus, string> = {
    idle: "[ SISTEMA_LISTO ]",
    loading: "[ EJECUTANDO_LIGHTHOUSE... ~60s ]",
    done: "[ ANÁLISIS_COMPLETO ]",
    error: "[ ERROR ]",
  };

  return (
    <main
      className="relative z-20 ml-60 pt-12 pb-16 flex flex-col items-center min-h-screen px-12 lg:px-24"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Status badge */}
      <div
        className="mb-12 px-4 py-1.5 text-xs tracking-[0.25em] uppercase"
        style={{
          backgroundColor: "var(--surface-high)",
          color: "var(--primary)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
        aria-live="polite"
      >
        {STATUS_MESSAGES[analysisStatus]}
      </div>

      {/* Page title */}
      <h1
        className="font-black mb-16 uppercase"
        style={{
          fontSize: "clamp(3.5rem, 8vw, 7rem)",
          letterSpacing: "0.06em",
          color: "var(--heading)",
          fontFamily: "var(--font-space-grotesk), sans-serif",
          lineHeight: 1,
        }}
      >
        AUDIT<span style={{ color: "var(--primary)" }}>IA</span>
      </h1>

      {/* Input card */}
      <div
        className="w-full max-w-2xl p-8 mb-6"
        style={{
          borderLeft: "2px solid var(--primary)",
          backgroundColor: "var(--surface)",
        }}
      >
        <UrlInput value={url} onChange={setUrl} disabled={isRunning} />

        {/* Mobile / Desktop strategy toggle */}
        <div className="flex mb-4" role="group" aria-label="Analysis strategy">
          {(["mobile", "desktop"] as Strategy[]).map((option) => {
            const isActive = strategy === option;
            return (
              <button
                key={option}
                onClick={() => setStrategy(option)}
                disabled={isRunning}
                aria-pressed={isActive}
                className="flex-1 py-2.5 text-xs tracking-[0.2em] font-bold uppercase flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  backgroundColor: isActive
                    ? "var(--primary)"
                    : "var(--surface-high)",
                  color: isActive ? "var(--primary-on)" : "var(--text-dim)",
                  cursor: isRunning ? "not-allowed" : "pointer",
                }}
              >
                {option === "mobile" ? <MobileIcon /> : <DesktopIcon />}
                {option}
              </button>
            );
          })}
        </div>

        {/* Analyze button */}
        <button
          className="w-full py-5 text-sm tracking-[0.25em] font-black uppercase flex items-center justify-center gap-3 transition-all duration-150 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            backgroundColor: "var(--primary)",
            color: "var(--primary-on)",
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!isRunning) e.currentTarget.style.filter = "brightness(0.88)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "";
          }}
          onClick={handleAnalyze}
          disabled={isRunning || !url.trim()}
          aria-busy={isRunning}
        >
          {isRunning ? (
            <>
              <span
                className="cursor-blink inline-block w-2 h-4"
                style={{ backgroundColor: "var(--primary-on)" }}
                aria-hidden="true"
              />
              &gt; Analizando...
            </>
          ) : (
            <>&gt; Analizar</>
          )}
        </button>
      </div>

      {/* Error message */}
      {analysisStatus === "error" && (
        <div
          className="w-full max-w-2xl p-6 text-sm"
          role="alert"
          style={{
            borderLeft: "2px solid #ff4e42",
            backgroundColor: "var(--surface)",
            color: "#ff4e42",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          ERROR: {errorMessage}
        </div>
      )}

      {/* Full Lighthouse report */}
      {report && (
        <div className="w-full max-w-2xl">
          {/* Audit metadata */}
          <div
            className="mb-6 text-xs"
            style={{
              color: "var(--text-dim)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {report.url} · {report.strategy} · Lighthouse{" "}
            {report.lighthouseVersion}
            {report.fetchTime && (
              <> · {new Date(report.fetchTime).toLocaleTimeString()}</>
            )}
          </div>

          {/* Score gauges — one per category */}
          <div
            className="grid grid-cols-4 gap-4 p-6 mb-8"
            style={{
              backgroundColor: "var(--surface)",
              borderLeft: "2px solid var(--primary)",
            }}
          >
            <ScoreGauge
              score={report.categories.performance.score}
              label="Performance"
            />
            <ScoreGauge
              score={report.categories.accessibility.score}
              label="Accessibility"
            />
            <ScoreGauge
              score={report.categories.bestPractices.score}
              label="Best Practices"
            />
            <ScoreGauge score={report.categories.seo.score} label="SEO" />
          </div>

          {/* Detailed audit results per category */}
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
