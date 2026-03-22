import { NextRequest } from "next/server";
import { OpenRouter } from "@openrouter/sdk";
import { execFile } from "node:child_process";
import { resolve } from "node:path";

export const maxDuration = 180;

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

function scoreEmoji(score: number) {
  if (score >= 90) return "🟢";
  if (score >= 50) return "🟠";
  return "🔴";
}

function scoreLabel(score: number) {
  if (score >= 90) return "PASS";
  if (score >= 50) return "NEEDS IMPROVEMENT";
  return "FAIL";
}

type Audit = {
  score: number | null;
  title: string;
  description?: string;
  displayValue?: string;
  details?: { type: string };
};

type Category = { score: number; title: string };

async function runLighthouse(url: string, strategy: "desktop" | "mobile" = "desktop"): Promise<Record<string, unknown>> {
  const script = resolve(process.cwd(), "scripts/run-lighthouse.mjs");

  return new Promise((resolvePromise, reject) => {
    execFile("node", [script, url, strategy], { maxBuffer: 20 * 1024 * 1024, timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
        return;
      }
      try {
        resolvePromise(JSON.parse(stdout));
      } catch {
        reject(new Error(`Failed to parse Lighthouse output: ${stdout.slice(0, 200)}`));
      }
    });
  });
}

function parseResults(url: string, lhr: Record<string, unknown>) {
  const cats = (lhr.categories ?? {}) as Record<string, Category>;
  const audits = (lhr.audits ?? {}) as Record<string, Audit>;

  const scores = {
    performance:   Math.round((cats.performance?.score   ?? 0) * 100),
    accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
    seo:           Math.round((cats.seo?.score           ?? 0) * 100),
    bestPractices: Math.round((cats["best-practices"]?.score ?? 0) * 100),
  };

  const failed = Object.values(audits)
    .filter((a) => a.score !== null && a.score < 1 && a.title)
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 20);

  const opportunities = Object.values(audits)
    .filter((a) => a.details?.type === "opportunity" && a.score !== null && a.score < 1);

  const header = [
    ``,
    `${"─".repeat(52)}`,
    `  LIGHTHOUSE AUDIT  —  ${url}`,
    `  Strategy: Desktop  |  Local Lighthouse (Chrome Headless)`,
    `${"─".repeat(52)}`,
    ``,
    `  ${scoreEmoji(scores.performance)}  Performance    ${scores.performance}/100   ${scoreLabel(scores.performance)}`,
    `  ${scoreEmoji(scores.accessibility)}  Accessibility  ${scores.accessibility}/100   ${scoreLabel(scores.accessibility)}`,
    `  ${scoreEmoji(scores.seo)}  SEO            ${scores.seo}/100   ${scoreLabel(scores.seo)}`,
    `  ${scoreEmoji(scores.bestPractices)}  Best Practices ${scores.bestPractices}/100   ${scoreLabel(scores.bestPractices)}`,
    ``,
    `${"─".repeat(52)}`,
    `  AI ANALYSIS`,
    `${"─".repeat(52)}`,
    ``,
  ].join("\n");

  const failedList = failed
    .map((a) => `• [${Math.round((a.score ?? 0) * 100)}] ${a.title}${a.displayValue ? ` → ${a.displayValue}` : ""}`)
    .join("\n");

  const oppList = opportunities
    .map((a) => `• ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`)
    .join("\n");

  const aiContext = `
URL: ${url}
Scores (already displayed to user — DO NOT repeat them as a list again):
  Performance ${scores.performance}/100, Accessibility ${scores.accessibility}/100, SEO ${scores.seo}/100, Best Practices ${scores.bestPractices}/100

Failed audits:
${failedList || "None"}

Performance opportunities:
${oppList || "None"}
`.trim();

  return { header, scores, aiContext };
}

const SYSTEM_PROMPT = `You are AuditIA, a web performance analyst.

The scores have ALREADY been shown to the user — do NOT repeat them as a list.

Your job: write a clear, honest analysis organized in four sections:
1. Performance — explain the failing audits and opportunities, what causes them, how to fix them
2. Accessibility — list each issue with a concrete fix
3. SEO — list each issue with a concrete fix
4. Best Practices — list each issue with a concrete fix

Rules:
- Be direct and honest. If a score is bad, say it is bad.
- Give specific, actionable fixes with code examples where useful.
- Skip sections with no issues (just write "No issues found" for that section).
- Use technical language suited for developers.
- Do NOT invent issues not present in the data.`;

export async function POST(req: NextRequest) {
  const { url: rawUrl, strategy = "desktop" } = await req.json();

  if (!rawUrl) {
    return new Response("Missing URL", { status: 400 });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response("OPENROUTER_API_KEY is not set", { status: 500 });
  }

  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  let header: string;
  let aiContext: string;

  try {
    const lhr = await runLighthouse(url, strategy);
    ({ header, aiContext } = parseResults(url, lhr));
  } catch (err) {
    return new Response(
      `ERROR_LIGHTHOUSE: ${err instanceof Error ? err.message : "Failed to run Lighthouse"}`,
      { status: 502 }
    );
  }

  const aiStream = await openrouter.chat.send({
    chatGenerationParams: {
      model: "openrouter/auto",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: aiContext },
      ],
      stream: true,
    },
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // 1. Stream the scores header directly — guaranteed to match Lighthouse
      controller.enqueue(encoder.encode(header));

      // 2. Stream AI narrative after
      try {
        for await (const chunk of aiStream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) controller.enqueue(encoder.encode(content));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
