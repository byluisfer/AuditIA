"use client";

import { useAppLanguage } from "../lib/app-language";

const I18N = {
  es: {
    sysEnv: "SYS_ENV: PRODUCCIÓN",
    admin: "ADMIN",
    infrastructure: "INFRA_NODE",
    codeArchive: "CODE_ARCHIVE",
    seedProject: "SEED_PROJECT",
  },
  en: {
    sysEnv: "SYS_ENV: PRODUCTION",
    admin: "ADMIN",
    infrastructure: "INFRA_NODE",
    codeArchive: "CODE_ARCHIVE",
    seedProject: "SEED_PROJECT",
  },
} as const;

export function Footer() {
  const language = useAppLanguage();
  const t = I18N[language];

  return (
    <footer
      suppressHydrationWarning
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
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-2 sm:py-2.5 gap-1.5 sm:gap-0 text-[10px] tracking-[0.18em] uppercase"
        style={{
          color: "var(--text-dim)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {/* Left — system env + core info */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <span style={{ color: "var(--primary)", opacity: 0.8 }}>
            {t.sysEnv}
          </span>
          <span className="hidden sm:inline" style={{ opacity: 0.2 }}>
            |
          </span>
          <span
            className="hidden sm:inline"
            style={{ opacity: 0.5, color: "var(--primary)" }}
          >
            {t.admin}:
          </span>
          <span
            className="hidden sm:inline"
            style={{ color: "var(--primary)" }}
          >
            MIDUDEV
          </span>
          <span className="hidden sm:inline" style={{ opacity: 0.2 }}>
            |
          </span>
          <span
            className="hidden sm:inline"
            style={{ opacity: 0.5, color: "var(--primary)" }}
          >
            {t.infrastructure}:
          </span>
          <span
            className="hidden sm:inline"
            style={{ color: "var(--primary)" }}
          >
            CUBEPATH
          </span>
        </div>

        {/* Right — external links */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <span
            className="hidden sm:inline"
            style={{ opacity: 0.5, color: "var(--primary)" }}
          >
            {t.codeArchive}:
          </span>
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
          <span className="hidden sm:inline" style={{ opacity: 0.2 }}>
            |
          </span>
          <span
            className="hidden sm:inline"
            style={{ opacity: 0.5, color: "var(--primary)" }}
          >
            {t.seedProject}:
          </span>
          <a
            href="https://github.com/midudev/hackaton-cubepath-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150 hidden sm:inline"
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
