"use client";

import { UrlInput } from "./url-input";

export function HeroSection() {
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
        [ SISTEMA_LISTO: ESPERANDO_INPUT ]
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

        <UrlInput />

        <button
          className="w-full py-5 text-sm tracking-[0.25em] font-black uppercase flex items-center justify-center gap-3 cursor-pointer transition-all duration-150 active:brightness-90"
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            backgroundColor: "var(--primary)",
            color: "var(--primary-on)",
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.88)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          &gt; Analizarla
        </button>
      </div>
    </main>
  );
}
