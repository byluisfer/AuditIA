"use client";

import { useAppLanguage } from "../lib/app-language";

const I18N = {
  es: {
    sysEnv: "SYS_ENV: PRODUCCIÓN",
    organizer: "ORGANIZER:",
    sponsor: "SPONSOR:",
    repo: "REPO:",
    hackathon: "HACKATON:",
  },
  en: {
    sysEnv: "SYS_ENV: PRODUCTION",
    organizer: "ORGANIZER:",
    sponsor: "SPONSOR:",
    repo: "REPO:",
    hackathon: "HACKATHON:",
  },
} as const;

export function Footer() {
  const language = useAppLanguage();
  const t = I18N[language];

  return (
    <footer
      className="fixed bottom-0 inset-x-0 z-60 flex flex-col"
      style={{ backgroundColor: "var(--surface)" }}
    >
      {/* Top border with primary glow */}
      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(to right, transparent, var(--primary), transparent)",
          opacity: 0.4,
        }}
      />

      <div
        className="flex items-center justify-between px-6 py-2.5 text-[10px] tracking-[0.18em] uppercase"
        style={{
          color: "var(--text-dim)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {/* Left — system env + hackathon credits */}
        <div className="flex items-center gap-4">
          <span style={{ color: "var(--primary)", opacity: 0.8 }}>
            {t.sysEnv}
          </span>
          <span style={{ opacity: 0.2 }}>|</span>
          <span style={{ opacity: 0.5 }}>{t.organizer}</span>
          <span style={{ color: "var(--primary)" }}>MIDUDEV</span>
          <span style={{ opacity: 0.2 }}>|</span>
          <span style={{ opacity: 0.5 }}>{t.sponsor}</span>
          <span style={{ color: "var(--primary)" }}>CUBEPATH</span>
        </div>

        {/* Right — external links */}
        <div className="flex items-center gap-4">
          <span style={{ opacity: 0.5 }}>{t.repo}</span>
          <a
            href="https://github.com/byluisfer/AuditIA"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150"
            style={{ color: "var(--primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            GITHUB/AUDITIA
          </a>
          <span style={{ opacity: 0.2 }}>|</span>
          <span style={{ opacity: 0.5 }}>{t.hackathon}</span>
          <a
            href="https://github.com/midudev/hackaton-cubepath-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150"
            style={{ color: "var(--primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            GITHUB/HACKATON
          </a>
        </div>
      </div>
    </footer>
  );
}
