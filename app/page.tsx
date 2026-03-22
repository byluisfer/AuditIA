"use client";
import { useState, useRef } from "react";

const navItems = [
  {
    label: "Panel",
    active: true,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Red",
    active: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
        <path strokeLinecap="square" d="M12 7v4M12 11l-5 6M12 11l5 6" />
      </svg>
    ),
  },
  {
    label: "Registros",
    active: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M4 4h16v16H4zM8 9h8M8 13h6" />
      </svg>
    ),
  },
  {
    label: "Seguridad",
    active: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 3l8 4v5c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V7l8-4z" />
      </svg>
    ),
  },
];

const bottomItems = [
  {
    label: "Ajustes",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="square" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path strokeLinecap="square" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
  {
    label: "Salir",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="square" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
      </svg>
    ),
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg)", fontFamily: "var(--font-jetbrains-mono), monospace" }}
    >
      {/* Scanlines — 2px repeating, 2% opacity */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 1px, var(--scanline-color) 1px, var(--scanline-color) 2px)",
        }}
      />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, var(--vignette-color) 100%)" }}
      />

      {/* ── HEADER ── full width, surface shift */}
      <header
        className="fixed top-0 inset-x-0 z-60 h-12 flex items-center justify-between px-6"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <nav
          className="flex items-center gap-8 text-[11px] tracking-[0.18em] uppercase"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          <span className="font-black" style={{ color: "var(--primary)" }}>AUDIT_IA</span>
          <a href="#" className="font-bold transition-colors" style={{ color: "var(--primary)" }}>Consola</a>
          <a href="#" className="transition-colors hover:text-(--primary)" style={{ color: "var(--text-dim)" }}>Red</a>
          <a href="#" className="transition-colors hover:text-(--primary)" style={{ color: "var(--text-dim)" }}>Archivo</a>
        </nav>
        <div className="flex items-center gap-4" style={{ color: "var(--secondary)" }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 20.25h.008v.008H12v-.008z" />
          </svg>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
      </header>

      {/* ── SIDEBAR ── surface shift, no border */}
      <aside
        className="fixed left-0 z-60 w-60 flex flex-col"
        style={{
          top: "3rem",
          bottom: "2rem",
          backgroundColor: "var(--surface)",
        }}
      >
        {/* Brand */}
        <div className="px-5 py-5">
          <div
            className="text-sm font-black tracking-[0.15em] uppercase"
            style={{ color: "var(--primary)", fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            TERMINAL V1.0
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase mt-1" style={{ color: "var(--secondary)" }}>
            SISTEMA_ESTABLE
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col flex-1">
          {navItems.map(({ label, active, icon }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-3 px-5 py-3.5 text-[11px] tracking-[0.18em] uppercase transition-colors duration-150"
              style={
                active
                  ? {
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-on)",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontWeight: 700,
                    }
                  : {
                      color: "var(--text-dim)",
                      fontFamily: "var(--font-inter), sans-serif",
                    }
              }
            >
              {icon}
              <span>&gt; {label}</span>
            </a>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid var(--outline)" }}>
          {bottomItems.map(({ label, icon }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-3 px-5 py-3 text-[11px] tracking-[0.18em] uppercase transition-colors duration-150 hover:text-(--primary)"
              style={{ color: "var(--secondary)", fontFamily: "var(--font-inter), sans-serif" }}
            >
              {icon}
              <span>{label}</span>
            </a>
          ))}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main
        className="relative z-20 ml-60 pt-12 pb-8 flex flex-col items-center justify-center min-h-screen px-12 lg:px-24"
        style={{ backgroundColor: "var(--bg)" }}
      >
        {/* Badge — bracket style */}
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

        {/* Title — Space Grotesk display font */}
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

        {/* Terminal panel — left 2px accent, surface shift */}
        <div
          className="w-full max-w-2xl p-8"
          style={{
            borderLeft: "2px solid var(--primary)",
            backgroundColor: "var(--surface)",
          }}
        >
          {/* Status line */}
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

          {/* Input — surface_container_highest */}
          <div
            className="flex items-center gap-4 px-6 py-5 mb-4 cursor-text"
            style={{ backgroundColor: "var(--surface-high)" }}
            onClick={() => inputRef.current?.focus()}
          >
            <span
              className="text-xl select-none shrink-0"
              style={{ color: "var(--primary)" }}
            >$</span>
            <div className="relative flex-1 flex items-center min-w-0 overflow-hidden text-base">
              <div className="flex items-center min-w-0 pointer-events-none select-none whitespace-pre">
                {url ? (
                  <>
                    <span style={{ color: "var(--text)" }}>{url}</span>
                    <span
                      className="cursor-blink shrink-0 inline-block w-[0.55em] h-[1.15em] translate-y-px"
                      style={{ backgroundColor: "var(--primary)" }}
                    />
                  </>
                ) : (
                  <>
                    <span
                      className="cursor-blink shrink-0 inline-block w-[0.55em] h-[1.15em] translate-y-px mr-1"
                      style={{ backgroundColor: "var(--primary)" }}
                    />
                    <span style={{ color: "var(--text-dim)" }}>https://tu-web.com</span>
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

          {/* CTA — 0px radius, solid primary */}
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
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            &gt; Analizarla
          </button>
        </div>
      </main>

      {/* ── FOOTER ── full width, surface shift */}
      <footer
        className="fixed bottom-0 inset-x-0 z-60 flex flex-col"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div style={{ height: "1px", backgroundColor: "var(--outline)" }} />
        <div
          className="flex items-center justify-between px-6 py-2.5 text-[10px] tracking-[0.18em] uppercase"
          style={{ color: "var(--secondary)", fontFamily: "var(--font-inter), sans-serif" }}
        >
          <span>SYS_ENV: PRODUCCIÓN &nbsp;|&nbsp; LOC: US_EAST_1 &nbsp;|&nbsp; ENC: AES_256</span>
          <div className="flex items-center gap-8">
            <a href="#" className="underline underline-offset-2 hover:text-(--primary) transition-colors duration-150">Documentación</a>
            <a href="#" className="underline underline-offset-2 hover:text-(--primary) transition-colors duration-150">API_REF</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
