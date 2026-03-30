import type { LighthouseReport, CategoryReport } from "../analyze/route";

export const maxDuration = 60;

// Models — tried in parallel, first valid response wins
const FREE_MODELS = [
  "openrouter/free",
  "stepfun/step-3.5-flash:free",
  "minimax/minimax-m2.5:free",
  "arcee-ai/trinity-large-preview:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
];

const MODEL_TIMEOUT_MS = 30_000;

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
const SYSTEM_PROMPT = `Eres un experto en rendimiento web, accesibilidad, SEO y buenas prácticas. Recibirás un informe Lighthouse condensado con los problemas reales detectados en el sitio.

REGLAS CRÍTICAS:
1. Crea exactamente un step por cada elemento del array "failingItems" de cada categoría. NO inventes issues extra. NO omitas ninguno.
2. TODO el texto debe estar en ESPAÑOL. Traduce los títulos al español de forma natural y precisa.
3. El campo "description" de cada step debe explicar CÓMO solucionar el problema paso a paso (con ejemplos de código si aplica), basándote en el campo "description" del failing item.

Responde SOLO con JSON válido, sin markdown, sin backticks, sin texto extra. Esquema exacto:

{
  "summary": "string - resumen de 2-3 frases en español del estado del sitio basándote en los scores y failing items reales",
  "categories": [
    {
      "category": "performance" | "accessibility" | "seo" | "bestPractices",
      "currentScore": number,
      "targetScore": 100,
      "objective": "string en español - qué se necesita para llegar a 100",
      "steps": [
        {
          "id": "string - id corto único (ej: perf-01)",
          "title": "string en ESPAÑOL - título claro traducido del failing item",
          "description": "string en ESPAÑOL - explicación paso a paso de CÓMO solucionar el problema. Incluye ejemplos concretos de código, configuración o comandos.",
          "priority": "alta" | "media" | "baja",
          "estimatedImpact": "string en ESPAÑOL - impacto concreto basado en los datos reales del item"
        }
      ]
    }
  ]
}

Reglas de prioridad:
- "alta": score < 0.5 o savingsMs > 1000
- "media": score 0.5–0.9 o savingsMs 200–1000
- "baja": resto

Ordena los steps de mayor a menor impacto (más savingsMs/savingsBytes primero, luego menor score).
Incluye solo las categorías del array "categories" que recibes (las que tienen failing items).`;

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

async function callModel(
  model: string,
  messages: { role: string; content: string }[],
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
      console.warn(
        `[roadmap] ${model} failed (${res.status}):`,
        data?.error?.message ?? "unknown",
      );
      return null;
    }

    const content = (data.choices?.[0]?.message?.content as string) || null;
    if (!content) return null;

    const parsed = JSON.parse(extractJSON(content));
    if (!Array.isArray(parsed.categories)) {
      console.warn(`[roadmap] ${model} returned invalid schema`);
      return null;
    }
    return parsed;
  } catch (err) {
    clearTimeout(timeout);
    console.warn(
      `[roadmap] ${model} error:`,
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

// Race all models in parallel — take the first valid response
async function raceModels(
  messages: { role: string; content: string }[],
): Promise<{ summary: string; categories: unknown[] } | null> {
  return new Promise((resolve) => {
    let settled = 0;
    let resolved = false;

    for (const model of FREE_MODELS) {
      console.log(`[roadmap] Racing model: ${model}`);
      callModel(model, messages).then((result) => {
        settled++;
        if (result && !resolved) {
          resolved = true;
          resolve(result);
        } else if (settled === FREE_MODELS.length && !resolved) {
          resolve(null);
        }
      });
    }
  });
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const report = (await req.json()) as LighthouseReport;

    if (!report?.categories) {
      return Response.json(
        { error: "Se requiere un informe Lighthouse válido" },
        { status: 400 },
      );
    }

    const condensed = condenseReport(report);

    // If every category is perfect, return early with no roadmap needed
    if (condensed.categories.length === 0) {
      return Response.json({
        summary:
          "El sitio alcanza puntuaciones perfectas en todas las categorías de Lighthouse. No hay mejoras pendientes.",
        categories: [],
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Genera el roadmap para este informe Lighthouse:\n\n${JSON.stringify(condensed)}`,
      },
    ];

    const roadmap = await raceModels(messages);

    if (!roadmap) {
      return Response.json(
        {
          error:
            "Todos los modelos están ocupados. Intenta de nuevo en unos segundos.",
        },
        { status: 502 },
      );
    }

    return Response.json(roadmap);
  } catch (err) {
    console.error("[roadmap] Error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return Response.json({ error: message }, { status: 500 });
  }
}
