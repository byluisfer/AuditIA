"use client";

import { useState } from "react";
import { UrlInput } from "./url-input";

type Status = "idle" | "loading" | "streaming" | "done" | "error";

export function HeroSection() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleAnalyze() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setResult("");
    setStatus("loading");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        const text = await res.text();
        setResult(`ERROR: ${text}`);
        setStatus("error");
        return;
      }

      setStatus("streaming");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value, { stream: true }));
      }

      setStatus("done");
    } catch (err) {
      setResult(`ERROR: ${err instanceof Error ? err.message : "Unknown error"}`);
      setStatus("error");
    }
  }

  const isRunning = status === "loading" || status === "streaming";

  return (
    <main
      className="relative z-20 ml-60 pt-12 pb-8 flex flex-col items-center justify-center min-h-screen px-12 lg:px-24"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div
        className="mb-12 px-4 py-1.5 text-xs tracking-[0.25em] uppercase"
        style={{
          backgroundColor: "var(--surface-high)",
          color: "var(--primary)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {status === "idle" && "[ SISTEMA_LISTO: ESPERANDO_INPUT ]"}
        {status === "loading" && "[ INICIANDO_ANÁLISIS... ]"}
        {status === "streaming" && "[ RECIBIENDO_DATOS... ]"}
        {status === "done" && "[ ANÁLISIS_COMPLETO ]"}
        {status === "error" && "[ ERROR: REVISAR_CONSOLA ]"}
      </div>

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

      <div
        className="w-full max-w-2xl p-8"
        style={{ borderLeft: "2px solid var(--primary)", backgroundColor: "var(--surface)" }}
      >
        <div
          className="flex items-center gap-2.5 text-xs tracking-[0.2em] uppercase mb-8"
          style={{ color: "var(--secondary)" }}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeWidth={1.75} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l2.5 2.5" />
          </svg>
          CARGA_SYS: CANAL_SEGURO_ESTABLECIDO
        </div>

        <UrlInput value={url} onChange={setUrl} disabled={isRunning} />

        <button
          className="w-full py-5 text-sm tracking-[0.25em] font-black uppercase flex items-center justify-center gap-3 transition-all duration-150 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            backgroundColor: "var(--primary)",
            color: "var(--primary-on)",
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)",
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => { if (!isRunning) e.currentTarget.style.filter = "brightness(0.88)"; }}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
          onClick={handleAnalyze}
          disabled={isRunning || !url.trim()}
        >
          {isRunning ? (
            <>
              <span className="cursor-blink inline-block w-2 h-4" style={{ backgroundColor: "var(--primary-on)" }} />
              &gt; Analizando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              &gt; Analizarla
            </>
          )}
        </button>
      </div>

      {result && (
        <div
          className="w-full max-w-2xl mt-6 p-8 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            borderLeft: "2px solid var(--secondary)",
            backgroundColor: "var(--surface)",
            color: "var(--text)",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          <div
            className="text-xs tracking-[0.2em] uppercase mb-6"
            style={{ color: "var(--secondary)" }}
          >
            &gt; OUTPUT / ANÁLISIS_IA
          </div>
          {result}
          {status === "streaming" && (
            <span
              className="cursor-blink inline-block w-[0.55em] h-[1em] translate-y-px ml-0.5"
              style={{ backgroundColor: "var(--primary)" }}
            />
          )}
        </div>
      )}
    </main>
  );
}
