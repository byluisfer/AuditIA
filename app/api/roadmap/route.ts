import type { LighthouseReport, CategoryReport } from "../analyze/route";

export const maxDuration = 60;

// Default model pool (mostly free). You can override via OPENROUTER_MODELS.
const DEFAULT_MODELS = [
  "openrouter/free",
  "stepfun/step-3.5-flash:free",
  "arcee-ai/trinity-large-preview:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

const MODEL_TIMEOUT_MS = 22_000;
const MODEL_BATCH_SIZE = 6;

// ── Report condensation ──────────────────────────────────────────────────────
function condenseCategoryReport(cat: CategoryReport) {
  const failingOpportunities = cat.opportunities.map((a) => ({
    title: a.title,
    description: a.description,
    displayValue: a.displayValue,
    savingsMs: a.savingsMs,
    savingsBytes: a.savingsBytes,
  }));

  const failingDiagnostics = cat.diagnostics
    .filter((a) => a.score !== null && a.score < 1)
    .map((a) => ({
      title: a.title,
      description: a.description,
      displayValue: a.displayValue,
      score: a.score,
    }));

  return {
    title: cat.title,
    score: cat.score,
    metrics: cat.metrics?.map((m) => ({
      title: m.title,
      displayValue: m.displayValue,
      score: m.score,
    })),
    // Only real failing items — AI builds one step per item
    failingItems: [...failingOpportunities, ...failingDiagnostics],
  };
}

type CondensedCategory = ReturnType<typeof condenseCategoryReport> & {
  categoryKey: string;
};

function condenseReport(report: LighthouseReport) {
  const { performance, accessibility, seo, bestPractices } = report.categories;

  const all: CondensedCategory[] = [
    { ...condenseCategoryReport(performance), categoryKey: "performance" },
    { ...condenseCategoryReport(accessibility), categoryKey: "accessibility" },
    { ...condenseCategoryReport(seo), categoryKey: "seo" },
    { ...condenseCategoryReport(bestPractices), categoryKey: "bestPractices" },
  ];

  // Only send categories with actual issues to the AI
  const withIssues = all.filter((c) => c.failingItems.length > 0);

  return {
    url: report.url,
    strategy: report.strategy,
    // Pass scores for all categories so AI can reference them in the summary
    scores: {
      performance: performance.score,
      accessibility: accessibility.score,
      seo: seo.score,
      bestPractices: bestPractices.score,
    },
    categories: withIssues,
  };
}

// ── AI prompt ────────────────────────────────────────────────────────────────
function buildSystemPrompt(language: "es" | "en") {
  if (language === "en") {
    return `You are an expert in web performance, accessibility, SEO, and best practices. You will receive a condensed Lighthouse report with real issues detected on the site.

CRITICAL RULES:
1. Create exactly one step per item in each category's "failingItems" array. Do NOT invent extra issues. Do NOT omit any issue.
2. ALL output text must be in ENGLISH.
3. Each step's "description" must explain HOW to solve the issue step-by-step (including code examples when useful), grounded in the failing item's "description".

Reply ONLY with valid JSON, with no markdown, no backticks, and no extra text. Exact schema:

{
  "summary": "string - 2-3 sentence summary in English based on real scores and failing items",
  "categories": [
    {
      "category": "performance" | "accessibility" | "seo" | "bestPractices",
      "currentScore": number,
      "targetScore": 100,
      "objective": "string in English - what is needed to reach 100",
      "steps": [
        {
          "id": "string - short unique id (e.g. perf-01)",
          "title": "string in ENGLISH - clear title translated from the failing item",
          "description": "string in ENGLISH - step-by-step fix with concrete code/config/command examples when relevant",
          "priority": "high" | "medium" | "low",
          "estimatedImpact": "string in ENGLISH - concrete impact based on real item data"
        }
      ]
    }
  ]
}

Priority rules:
- "high": score < 0.5 or savingsMs > 1000
- "medium": score 0.5-0.9 or savingsMs 200-1000
- "low": otherwise

Order steps from highest to lowest impact (higher savingsMs/savingsBytes first, then lower score).
Include only the categories provided in the "categories" array (those with failing items).`;
  }

  return `Eres un experto en rendimiento web, accesibilidad, SEO y buenas practicas. Recibiras un informe Lighthouse condensado con los problemas reales detectados en el sitio.

REGLAS CRITICAS:
1. Crea exactamente un step por cada elemento del array "failingItems" de cada categoria. NO inventes issues extra. NO omitas ninguno.
2. TODO el texto debe estar en ESPANOL. Traduce los titulos al espanol de forma natural y precisa.
3. El campo "description" de cada step debe explicar COMO solucionar el problema paso a paso (con ejemplos de codigo si aplica), basandote en el campo "description" del failing item.

Responde SOLO con JSON valido, sin markdown, sin backticks, sin texto extra. Esquema exacto:

{
  "summary": "string - resumen de 2-3 frases en espanol del estado del sitio basandote en los scores y failing items reales",
  "categories": [
    {
      "category": "performance" | "accessibility" | "seo" | "bestPractices",
      "currentScore": number,
      "targetScore": 100,
      "objective": "string en espanol - que se necesita para llegar a 100",
      "steps": [
        {
          "id": "string - id corto unico (ej: perf-01)",
          "title": "string en ESPANOL - titulo claro traducido del failing item",
          "description": "string en ESPANOL - explicacion paso a paso de COMO solucionar el problema. Incluye ejemplos concretos de codigo, configuracion o comandos.",
          "priority": "alta" | "media" | "baja",
          "estimatedImpact": "string en ESPANOL - impacto concreto basado en los datos reales del item"
        }
      ]
    }
  ]
}

Reglas de prioridad:
- "alta": score < 0.5 o savingsMs > 1000
- "media": score 0.5-0.9 o savingsMs 200-1000
- "baja": resto

Ordena los steps de mayor a menor impacto (mas savingsMs/savingsBytes primero, luego menor score).
Incluye solo las categorias del array "categories" que recibes (las que tienen failing items).`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractJSON(text: string): string {
  let cleaned = text.trim();
  // Strip markdown fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }
  // Find JSON boundaries in case model added preamble
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return cleaned.trim();
}

function uniqueModels(models: string[]): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const raw of models) {
    const model = raw.trim();
    if (!model || seen.has(model)) continue;
    seen.add(model);
    list.push(model);
  }
  return list;
}

function getModelPool(): string[] {
  const envRaw = process.env.OPENROUTER_MODELS;
  if (!envRaw) return uniqueModels(DEFAULT_MODELS);

  const envModels = uniqueModels(envRaw.split(","));
  if (envModels.length === 0) return uniqueModels(DEFAULT_MODELS);

  // Env list first, then defaults as extra fallback.
  return uniqueModels([...envModels, ...DEFAULT_MODELS]);
}

function shuffleModels(models: string[]): string[] {
  const next = [...models];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function isFreeModel(model: string): boolean {
  return model.endsWith(":free") || model === "openrouter/free";
}

function hasFreeDailyQuotaError(failures: string[]): boolean {
  return failures.some((f) => f.toLowerCase().includes("free-models-per-day"));
}

async function callModel(
  model: string,
  messages: { role: string; content: string }[],
  failures: string[],
): Promise<{ summary: string; categories: unknown[] } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature: 0.2 }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await res.json();

    if (!res.ok) {
      const reason = data?.error?.message ?? "unknown";
      failures.push(`${model} [${res.status}] ${reason}`);
      console.warn(`[roadmap] ${model} failed (${res.status}):`, reason);
      return null;
    }

    const content = (data.choices?.[0]?.message?.content as string) || null;
    if (!content) {
      failures.push(`${model} [empty] empty response content`);
      return null;
    }

    const parsed = JSON.parse(extractJSON(content));
    if (!Array.isArray(parsed.categories)) {
      failures.push(`${model} [schema] invalid categories schema`);
      console.warn(`[roadmap] ${model} returned invalid schema`);
      return null;
    }
    return parsed;
  } catch (err) {
    clearTimeout(timeout);
    failures.push(
      `${model} [exception] ${err instanceof Error ? err.message : "unknown"}`,
    );
    console.warn(
      `[roadmap] ${model} error:`,
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

// Race one batch in parallel — take the first valid response
async function raceModelBatch(
  models: string[],
  messages: { role: string; content: string }[],
  failures: string[],
): Promise<{ summary: string; categories: unknown[] } | null> {
  return new Promise((resolve) => {
    let settled = 0;
    let resolved = false;

    for (const model of models) {
      console.log(`[roadmap] Racing model: ${model}`);
      callModel(model, messages, failures).then((result) => {
        settled++;
        if (result && !resolved) {
          resolved = true;
          resolve(result);
        } else if (settled === models.length && !resolved) {
          resolve(null);
        }
      });
    }
  });
}

// Try batches sequentially to avoid request fan-out explosions under traffic.
async function raceModels(
  messages: { role: string; content: string }[],
): Promise<{
  roadmap: { summary: string; categories: unknown[] } | null;
  failures: string[];
}> {
  const pool = shuffleModels(getModelPool());
  if (pool.length === 0) {
    return { roadmap: null, failures: ["no models in pool"] };
  }

  const failures: string[] = [];
  const allModelsAreFree = pool.every(isFreeModel);

  for (let i = 0; i < pool.length; i += MODEL_BATCH_SIZE) {
    const batch = pool.slice(i, i + MODEL_BATCH_SIZE);
    console.log(
      `[roadmap] Trying batch ${Math.floor(i / MODEL_BATCH_SIZE) + 1}/${Math.ceil(pool.length / MODEL_BATCH_SIZE)} (${batch.length} models)`,
    );
    const result = await raceModelBatch(batch, messages, failures);
    if (result) return { roadmap: result, failures };

    // Fast-fail: if every configured model is free and the account hit free daily quota,
    // continuing to next batches only increases latency with no chance of success.
    if (allModelsAreFree && hasFreeDailyQuotaError(failures)) {
      console.warn(
        "[roadmap] Free daily quota exhausted; stopping further batches",
      );
      break;
    }
  }

  return { roadmap: null, failures };
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as
      | LighthouseReport
      | { report: LighthouseReport; language?: "es" | "en" };

    const hasWrappedBody =
      typeof body === "object" &&
      body !== null &&
      "report" in body &&
      typeof body.report === "object";

    const report = hasWrappedBody
      ? (body.report as LighthouseReport)
      : (body as LighthouseReport);
    const language = hasWrappedBody && body.language === "en" ? "en" : "es";

    if (!report?.categories) {
      return Response.json(
        {
          error:
            language === "en"
              ? "A valid Lighthouse report is required"
              : "Se requiere un informe Lighthouse valido",
        },
        { status: 400 },
      );
    }

    const condensed = condenseReport(report);

    // If every category is perfect, return early with no roadmap needed
    if (condensed.categories.length === 0) {
      return Response.json({
        summary:
          language === "en"
            ? "The site reaches perfect scores in all Lighthouse categories. No pending improvements."
            : "El sitio alcanza puntuaciones perfectas en todas las categorias de Lighthouse. No hay mejoras pendientes.",
        categories: [],
      });
    }

    const messages = [
      { role: "system", content: buildSystemPrompt(language) },
      {
        role: "user",
        content:
          language === "en"
            ? `Generate the roadmap for this Lighthouse report:\n\n${JSON.stringify(condensed)}`
            : `Genera el roadmap para este informe Lighthouse:\n\n${JSON.stringify(condensed)}`,
      },
    ];

    const { roadmap, failures } = await raceModels(messages);

    if (!roadmap) {
      const hasPrivacyGuardrail = failures.some((f) =>
        f.toLowerCase().includes("guardrail restrictions and data policy"),
      );
      const hasRateLimit = failures.some(
        (f) => f.includes("[429]") || f.toLowerCase().includes("rate limit"),
      );
      const hasFreeDailyQuota = hasFreeDailyQuotaError(failures);
      const hasInvalidModelId = failures.some((f) =>
        f.toLowerCase().includes("not a valid model id"),
      );

      const sampleFailures = failures.slice(0, 5).join(" | ");
      console.error(
        `[roadmap] Exhausted model pool (${failures.length} failures). Samples: ${sampleFailures}`,
      );

      if (hasPrivacyGuardrail) {
        return Response.json(
          {
            error:
              language === "en"
                ? "OpenRouter blocked providers due to privacy/guardrail settings. In OpenRouter Settings > Privacy, allow provider endpoints for this project, or define OPENROUTER_MODELS with models compatible with your policy."
                : "OpenRouter bloqueo proveedores por la politica de privacidad/guardrails. En OpenRouter Settings > Privacy, permite endpoints de proveedores para este proyecto o define OPENROUTER_MODELS con modelos compatibles.",
          },
          { status: 502 },
        );
      }

      if (hasInvalidModelId) {
        return Response.json(
          {
            error:
              language === "en"
                ? "Some configured model IDs are invalid on OpenRouter. Review OPENROUTER_MODELS or update the default model list."
                : "Algunos model IDs configurados no son validos en OpenRouter. Revisa OPENROUTER_MODELS o actualiza la lista por defecto.",
          },
          { status: 502 },
        );
      }

      return Response.json(
        {
          error:
            language === "en"
              ? hasFreeDailyQuota
                ? "Free model daily quota exhausted on OpenRouter. No need to keep waiting now: add at least 10 credits or switch OPENROUTER_MODELS to paid models."
                : hasRateLimit
                  ? "All providers are rate-limited right now. Try again in a few seconds or use paid models in OPENROUTER_MODELS."
                  : "All model attempts failed. Please try again in a few seconds."
              : hasFreeDailyQuota
                ? "La cuota diaria de modelos free en OpenRouter esta agotada. No conviene seguir esperando ahora: agrega al menos 10 creditos o usa modelos de pago en OPENROUTER_MODELS."
                : "Todos los modelos estan ocupados. Intenta de nuevo en unos segundos.",
        },
        { status: 502 },
      );
    }

    return Response.json(roadmap);
  } catch (err) {
    console.error("[roadmap] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
