import { NextRequest } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `You are AuditIA, an expert web auditor specialized in UX, Performance, Accessibility, and SEO analysis.
When given a URL, provide a structured audit report covering:

1. **UX Analysis** — navigation, layout clarity, call-to-action effectiveness
2. **Performance** — estimated load time issues, asset optimization, render-blocking resources
3. **Accessibility** — WCAG compliance indicators, contrast, keyboard navigation, screen reader support
4. **SEO** — meta tags, structured data, content hierarchy, mobile-friendliness signals

Format your response in clear sections. Be direct, specific, and actionable. Use terminal/technical language that fits a developer audience.`;

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response("OPENROUTER_API_KEY is not set", { status: 500 });
  }

  const stream = await openrouter.chat.send({
    chatGenerationParams: {
      model: "openrouter/auto",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this website: ${url}` },
      ],
      stream: true,
    },
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
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
