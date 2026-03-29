import type { LighthouseReport, CategoryReport } from "../analyze/route";

export const maxDuration = 60;

// Models
const FREE_MODELS = [
  "openrouter/free",
  "stepfun/step-3.5-flash:free",
  "minimax/minimax-m2.5:free",
  "arcee-ai/trinity-large-preview:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
];

const MODEL_TIMEOUT_MS = 25_000;

// ── Report condensation ──────────────────────────────────────────────────────
function condenseCategoryReport(cat: CategoryReport) {
  return {
    title: cat.title,
    score: cat.score,
    opportunities: cat.opportunities.map((a) => ({
      title: a.title,
      displayValue: a.displayValue,
      savingsMs: a.savingsMs,
      savingsBytes: a.savingsBytes,
    })),
    diagnostics: cat.diagnostics
      .filter((a) => a.score !== null && a.score < 1)
      .map((a) => ({
        title: a.title,
        displayValue: a.displayValue,
        score: a.score,
      })),
    metrics: cat.metrics?.map((m) => ({
      title: m.title,
      displayValue: m.displayValue,
      score: m.score,
    })),
  };
}

function condenseReport(report: LighthouseReport) {
  const { performance, accessibility, seo, bestPractices } = report.categories;
  return {
    url: report.url,
    strategy: report.strategy,
    categories: {
      performance: condenseCategoryReport(performance),
      accessibility: condenseCategoryReport(accessibility),
      seo: condenseCategoryReport(seo),
      bestPractices: condenseCategoryReport(bestPractices),
    },
  };
}

// ── AI prompt ────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres un consultor experto en rendimiento web, accesibilidad, SEO y buenas prácticas. Analiza el informe Lighthouse proporcionado y genera un roadmap estructurado en JSON para llevar cada categoría a 100/100.

Responde SOLO con JSON válido, sin markdown, sin backticks, sin explicaciones. El JSON debe seguir exactamente este esquema:

{
  "summary": "string - resumen general de 2-3 frases del estado del sitio y las mejoras principales necesarias",
  "categories": [
    {
      "category": "performance" | "accessibility" | "seo" | "bestPractices",
      "currentScore": number,
      "targetScore": 100,
      "objective": "string - objetivo general para esta categoría",
      "steps": [
        {
          "id": "string - identificador único corto (ej: perf-01)",
          "title": "string - título corto y claro de la acción",
          "description": "string - explicación paso a paso de CÓMO solucionar el problema, con ejemplos de código o configuración si aplica. Debe ser claro para alguien sin experiencia avanzada.",
          "priority": "alta" | "media" | "baja",
          "estimatedImpact": "string - impacto concreto, ej: +15 puntos en Performance"
        }
      ]
    }
  ]
}

Reglas:
- Todo el texto DEBE estar en español
- Cada step.description debe explicar CÓMO solucionar el problema paso a paso, no solo qué está mal
- Ordena los steps por impacto (mayor ahorro primero)
- priority "alta" = ahorro >1s o score <0.5, "media" = ahorro 0.2-1s o score 0.5-0.9, "baja" = resto
- estimatedImpact debe ser concreto: "+X puntos en [categoría]"
- Máximo 8 steps por categoría, enfócate en los más impactantes
- Si una categoría ya tiene score >= 95, incluye solo 1-2 pasos de refinamiento
- Incluye las 4 categorías siempre, en este orden: performance, accessibility, seo, bestPractices`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractJSON(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

async function callModel(
  model: string,
  messages: { role: string; content: string }[],
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature: 0.3 }),
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

    return (data.choices?.[0]?.message?.content as string) || null;
  } catch (err) {
    clearTimeout(timeout);
    console.warn(
      `[roadmap] ${model} error:`,
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
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

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analiza este informe Lighthouse y genera el roadmap:\n\n${JSON.stringify(condenseReport(report))}`,
      },
    ];

    let content: string | null = null;

    for (const model of FREE_MODELS) {
      console.log(`[roadmap] Trying model: ${model}`);
      content = await callModel(model, messages);
      if (content) break;
    }

    if (!content) {
      return Response.json(
        {
          error:
            "Todos los modelos están ocupados. Intenta de nuevo en unos segundos.",
        },
        { status: 502 },
      );
    }

    const roadmap = JSON.parse(extractJSON(content));

    if (!Array.isArray(roadmap.categories)) {
      return Response.json(
        { error: "La respuesta de la IA no tiene el formato esperado" },
        { status: 502 },
      );
    }

    return Response.json(roadmap);
  } catch (err) {
    console.error("[roadmap] Error:", err);
    const message =
      err instanceof SyntaxError
        ? "La IA devolvió un formato no válido. Intenta de nuevo."
        : err instanceof Error
          ? err.message
          : "Error desconocido";
    return Response.json({ error: message }, { status: 500 });
  }
}
