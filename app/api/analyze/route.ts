import { NextRequest } from "next/server";
import { execFile } from "node:child_process";
import { resolve } from "node:path";

export const maxDuration = 180;

// Types
type LhrAudit = {
  id: string;
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: string;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
  details?: {
    type: string;
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
    items?: unknown[];
  };
  warnings?: string[];
};
type LhrCategory = {
  title: string;
  score: number;
  auditRefs: { id: string; weight: number; group?: string }[];
};
export type AuditResult = {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  numericValue?: number;
  savingsMs?: number;
  savingsBytes?: number;
  warnings?: string[];
};
export type CategoryReport = {
  title: string;
  score: number;
  metrics: AuditResult[];
  opportunities: AuditResult[];
  diagnostics: AuditResult[];
  passed: AuditResult[];
};
export type LighthouseReport = {
  url: string;
  strategy: string;
  fetchTime: string;
  lighthouseVersion: string;
  categories: {
    performance: CategoryReport;
    accessibility: CategoryReport;
    seo: CategoryReport;
    bestPractices: CategoryReport;
  };
};

// Constants
const PERFORMANCE_METRIC_IDS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
  "interactive",
];
const PERFORMANCE_METRIC_ID_SET = new Set(PERFORMANCE_METRIC_IDS);

// Lighthouse runner
async function runLighthouse(
  url: string,
  strategy: "desktop" | "mobile",
): Promise<Record<string, unknown>> {
  const scriptPath = resolve(process.cwd(), "scripts/run-lighthouse.mjs");

  return new Promise((resolve, reject) => {
    execFile(
      "node",
      [scriptPath, url, strategy],
      { maxBuffer: 20 * 1024 * 1024, timeout: 120_000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(
            new Error(
              `Failed to parse Lighthouse output: ${stdout.slice(0, 300)}`,
            ),
          );
        }
      },
    );
  });
}

// Result shaping
function toAuditResult(audit: LhrAudit): AuditResult {
  return {
    id: audit.id,
    title: audit.title,
    description: audit.description,
    score: audit.score,
    displayValue: audit.displayValue,
    numericValue: audit.numericValue,
    savingsMs: audit.details?.overallSavingsMs,
    savingsBytes: audit.details?.overallSavingsBytes,
    warnings: audit.warnings?.length ? audit.warnings : undefined,
  };
}
function buildCategoryReport(
  category: LhrCategory,
  audits: Record<string, LhrAudit>,
  categoryKey: string,
): CategoryReport {
  const metrics: AuditResult[] = [];
  const opportunities: AuditResult[] = [];
  const diagnostics: AuditResult[] = [];
  const passed: AuditResult[] = [];

  for (const ref of category.auditRefs) {
    const audit = audits[ref.id];
    if (!audit) continue;

    if (
      audit.scoreDisplayMode === "notApplicable" ||
      audit.scoreDisplayMode === "manual"
    ) {
      continue;
    }

    const auditResult = toAuditResult(audit);

    // Performance metrics go in their own section, not Opportunities/Diagnostics
    if (
      categoryKey === "performance" &&
      PERFORMANCE_METRIC_ID_SET.has(audit.id)
    ) {
      metrics.push(auditResult);
      continue;
    }

    if (audit.score === null || audit.score === 1) {
      passed.push(auditResult);
    } else if (audit.details?.type === "opportunity") {
      opportunities.push(auditResult);
    } else {
      diagnostics.push(auditResult);
    }
  }

  // Highest savings first — most impactful opportunities at the top
  opportunities.sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0));

  // Lowest score first — worst failures at the top
  diagnostics.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));

  // Preserve the official metric display order
  metrics.sort(
    (a, b) =>
      PERFORMANCE_METRIC_IDS.indexOf(a.id) -
      PERFORMANCE_METRIC_IDS.indexOf(b.id),
  );

  return {
    title: category.title,
    score: Math.round(category.score * 100),
    metrics,
    opportunities,
    diagnostics,
    passed,
  };
}

// Route handler
export async function POST(req: NextRequest) {
  const { url: rawUrl, strategy = "mobile" } = await req.json();

  if (!rawUrl) return new Response("Missing URL", { status: 400 });

  // Prepend https:// if the user omitted the protocol
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  let lhr: Record<string, unknown>;
  try {
    lhr = await runLighthouse(url, strategy as "desktop" | "mobile");
  } catch (err) {
    return new Response(
      `ERROR_LIGHTHOUSE: ${err instanceof Error ? err.message : "Failed to run Lighthouse"}`,
      { status: 502 },
    );
  }

  const rawCategories = (lhr.categories ?? {}) as Record<string, LhrCategory>;
  const rawAudits = (lhr.audits ?? {}) as Record<string, LhrAudit>;

  const report: LighthouseReport = {
    url,
    strategy,
    fetchTime: lhr.fetchTime as string,
    lighthouseVersion: lhr.lighthouseVersion as string,
    categories: {
      performance: buildCategoryReport(
        rawCategories.performance,
        rawAudits,
        "performance",
      ),
      accessibility: buildCategoryReport(
        rawCategories.accessibility,
        rawAudits,
        "accessibility",
      ),
      seo: buildCategoryReport(rawCategories.seo, rawAudits, "seo"),
      bestPractices: buildCategoryReport(
        rawCategories["best-practices"],
        rawAudits,
        "best-practices",
      ),
    },
  };

  return Response.json(report);
}
