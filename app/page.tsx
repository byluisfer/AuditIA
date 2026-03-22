"use client";
import { useState, useRef } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <main
      className="relative min-h-screen bg-(--bg) flex flex-col items-center justify-center px-8 sm:px-16 lg:px-32 py-16 overflow-hidden"
      style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
    >

      {/* CRT scanlines */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, var(--scanline-color) 3px, var(--scanline-color) 4px)",
        }}
      />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, var(--vignette-color) 100%)",
        }}
      />

      {/* Green ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 48%, color-mix(in srgb, var(--secondary) var(--glow-strength), transparent) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center w-full max-w-3xl">

        {/* System badge */}
        <div
          className="mb-12 px-5 py-2 text-xs tracking-[0.25em] uppercase"
          style={{
            border: "1px solid color-mix(in srgb, var(--secondary) 30%, transparent)",
            background: "color-mix(in srgb, var(--secondary) 5%, transparent)",
            color: "var(--secondary)",
          }}
        >
          [ SISTEMA_LISTO: ESPERANDO_INPUT ]
        </div>

        {/* Title */}
        <h1
          className="text-7xl sm:text-8xl lg:text-9xl font-black mb-20 uppercase"
          style={{ letterSpacing: "0.08em", color: "var(--heading)" }}
        >
          AUDIT<span style={{ color: "var(--secondary)" }}>IA</span>
        </h1>

        {/* Terminal panel */}
        <div
          className="w-full p-8"
          style={{
            borderLeft: "3px solid var(--secondary)",
            boxShadow: "-6px 0 24px color-mix(in srgb, var(--secondary) 25%, transparent)",
          }}
        >

          {/* Status line */}
          <div
            className="flex items-center gap-2.5 text-xs tracking-[0.2em] uppercase mb-8"
            style={{ color: "color-mix(in srgb, var(--secondary) 55%, transparent)" }}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth={1.75} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l2.5 2.5" />
            </svg>
            CARGA_SYS: CANAL_SEGURO_ESTABLECIDO
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-4 px-6 py-5 mb-4 cursor-text"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid color-mix(in srgb, var(--secondary) 20%, transparent)",
              boxShadow: "inset 0 0 30px color-mix(in srgb, var(--secondary) 2%, transparent)",
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <span className="text-xl select-none shrink-0" style={{ color: "var(--secondary)" }}>$</span>

            {/* Terminal display: text + cursor inline, hidden real input on top */}
            <div className="relative flex-1 flex items-center min-w-0 overflow-hidden text-base">

              {/* Visible display layer */}
              <div className="flex items-center min-w-0 pointer-events-none select-none whitespace-pre">
                {url ? (
                  <>
                    <span style={{ color: "var(--text)" }}>{url}</span>
                    <span className="cursor-blink shrink-0 inline-block w-[0.55em] h-[1.15em] translate-y-px" style={{ backgroundColor: "var(--secondary)" }} />
                  </>
                ) : (
                  <>
                    <span className="cursor-blink shrink-0 inline-block w-[0.55em] h-[1.15em] translate-y-px mr-1" style={{ backgroundColor: "var(--secondary)" }} />
                    <span style={{ color: "color-mix(in srgb, var(--secondary) 35%, transparent)" }}>https://tu-web.com</span>
                  </>
                )}
              </div>

              {/* Invisible real input — captures all keyboard input */}
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="absolute inset-0 w-full opacity-0 cursor-text"
                style={{ fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* CTA button */}
          <button
            className="w-full py-6 text-sm tracking-[0.25em] font-black uppercase flex items-center justify-center gap-3 cursor-pointer transition-all duration-150 hover:brightness-110 active:scale-[0.99]"
            style={{
              fontFamily: "inherit",
              backgroundColor: "var(--secondary)",
              color: "var(--bg)",
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)",
              boxShadow:
                "0 0 30px color-mix(in srgb, var(--secondary) 40%, transparent), 0 0 70px color-mix(in srgb, var(--secondary) 15%, transparent)",
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            &gt; Analizarla
          </button>

        </div>
      </div>
    </main>
  );
}
