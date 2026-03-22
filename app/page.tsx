"use client";
import { useState, useRef } from "react";

const navItems = [
  {
    label: "Panel",
    active: true,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Red",
    active: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a2 2 0 100 4 2 2 0 000-4zm-6 8a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4zm-6 0v-4m-4 2h8" />
      </svg>
    ),
  },
  {
    label: "Registros",
    active: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Seguridad",
    active: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

const bottomItems = [
  {
    label: "Ajustes",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Salir",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
      </svg>
    ),
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="min-h-screen bg-(--bg)"
      style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
    >
      {/* CRT scanlines */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, var(--scanline-color) 3px, var(--scanline-color) 4px)" }}
      />
      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, var(--vignette-color) 100%)" }}
      />
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{ background: "radial-gradient(ellipse at 50% 48%, color-mix(in srgb, var(--secondary) var(--glow-strength), transparent) 0%, transparent 60%)" }}
      />

      {/* ── HEADER — full width ── */}
      <header
        className="fixed top-0 inset-x-0 z-60 h-12 flex items-center justify-between px-6"
        style={{
          backgroundColor: "var(--bg)",
          borderBottom: "1px solid color-mix(in srgb, var(--secondary) 25%, transparent)",
        }}
      >
        <nav className="flex items-center gap-8 text-[11px] tracking-[0.18em] uppercase">
          <span className="font-black" style={{ color: "var(--secondary)" }}>AUDIT_IA</span>
          <a href="#" className="font-bold" style={{ color: "var(--secondary)" }}>Consola</a>
          <a href="#" className="hover:text-(--secondary) transition-colors" style={{ color: "color-mix(in srgb, var(--secondary) 45%, transparent)" }}>Red</a>
          <a href="#" className="hover:text-(--secondary) transition-colors" style={{ color: "color-mix(in srgb, var(--secondary) 45%, transparent)" }}>Archivo</a>
        </nav>
        <div className="flex items-center gap-4" style={{ color: "color-mix(in srgb, var(--secondary) 55%, transparent)" }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 20.25h.008v.008H12v-.008z" />
          </svg>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
      </header>

      {/* ── SIDEBAR — below header, above footer ── */}
      <aside
        className="fixed left-0 z-60 w-60 flex flex-col"
        style={{
          top: "3rem",      /* h-12 */
          bottom: "2rem",   /* footer height */
          backgroundColor: "var(--bg)",
          borderRight: "1px solid color-mix(in srgb, var(--secondary) 20%, transparent)",
        }}
      >
        {/* Brand */}
        <div
          className="px-5 py-5"
          style={{ borderBottom: "1px solid color-mix(in srgb, var(--secondary) 15%, transparent)" }}
        >
          <div className="text-sm font-black tracking-[0.15em] uppercase" style={{ color: "var(--secondary)" }}>
            TERMINAL V1.0
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase mt-1" style={{ color: "color-mix(in srgb, var(--secondary) 40%, transparent)" }}>
            SISTEMA_ESTABLE
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col flex-1 pt-1">
          {navItems.map(({ label, active, icon }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-3 px-5 py-3.5 text-[11px] tracking-[0.18em] uppercase transition-colors duration-150"
              style={
                active
                  ? { backgroundColor: "var(--secondary)", color: "var(--bg)" }
                  : {
                      color: "color-mix(in srgb, var(--secondary) 50%, transparent)",
                      borderBottom: "1px solid color-mix(in srgb, var(--secondary) 10%, transparent)",
                    }
              }
            >
              {icon}
              <span>&gt; {label}</span>
            </a>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid color-mix(in srgb, var(--secondary) 15%, transparent)" }}>
          {bottomItems.map(({ label, icon }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-3 px-5 py-3 text-[11px] tracking-[0.18em] uppercase transition-colors duration-150 hover:text-(--secondary)"
              style={{ color: "color-mix(in srgb, var(--secondary) 35%, transparent)" }}
            >
              {icon}
              <span>{label}</span>
            </a>
          ))}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-20 ml-60 pt-12 pb-8 flex flex-col items-center justify-center min-h-screen px-12 lg:px-24">

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
          className="text-6xl sm:text-7xl lg:text-8xl font-black mb-16 uppercase"
          style={{ letterSpacing: "0.08em", color: "var(--heading)" }}
        >
          AUDIT<span style={{ color: "var(--secondary)" }}>IA</span>
        </h1>

        {/* Terminal panel */}
        <div
          className="w-full max-w-2xl p-8"
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
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <span className="text-xl select-none shrink-0" style={{ color: "var(--secondary)" }}>$</span>
            <div className="relative flex-1 flex items-center min-w-0 overflow-hidden text-base">
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

          {/* CTA */}
          <button
            className="w-full py-6 text-sm tracking-[0.25em] font-black uppercase flex items-center justify-center gap-3 cursor-pointer transition-all duration-150 hover:brightness-110 active:scale-[0.99]"
            style={{
              fontFamily: "inherit",
              backgroundColor: "var(--secondary)",
              color: "var(--bg)",
              backgroundImage: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)",
              boxShadow: "0 0 30px color-mix(in srgb, var(--secondary) 40%, transparent), 0 0 70px color-mix(in srgb, var(--secondary) 15%, transparent)",
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            &gt; Analizarla
          </button>
        </div>
      </main>

      {/* ── FOOTER — full width ── */}
      <footer
        className="fixed bottom-0 inset-x-0 z-60 flex flex-col"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div style={{ height: "1px", backgroundColor: "color-mix(in srgb, var(--secondary) 30%, transparent)" }} />
        <div
          className="flex items-center justify-between px-6 py-2.5 text-[10px] tracking-[0.18em] uppercase"
          style={{ color: "color-mix(in srgb, var(--secondary) 70%, transparent)" }}
        >
          <span>SYS_ENV: PRODUCCIÓN &nbsp;|&nbsp; LOC: US_EAST_1 &nbsp;|&nbsp; ENC: AES_256</span>
          <div className="flex items-center gap-8">
            <a href="#" className="underline underline-offset-2 hover:text-(--secondary) transition-colors duration-150">Documentación</a>
            <a href="#" className="underline underline-offset-2 hover:text-(--secondary) transition-colors duration-150">API_REF</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
