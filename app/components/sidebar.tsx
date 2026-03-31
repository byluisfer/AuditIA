"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppLanguage, setAppLanguage } from "../lib/app-language";
import { useSidebarInitialCollapsed } from "./sidebar-preference-provider";

const SIDEBAR_KEY = "sidebar-collapsed";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const THEME_KEY = "auditia-theme";
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const FOOTER_HEIGHT = "41px";
type ThemeMode = "light" | "dark";

const I18N = {
  es: {
    analysis: "Análisis",
    roadmaps: "Roadmaps",
    settings: "Ajustes",
    close: "Cerrar",
    theme: "Tema",
    language: "Idioma",
    changeTheme: "Cambiar tema",
    changeLanguage: "Cambiar idioma",
    spanish: "Español",
    english: "Inglés",
    openSettings: "Abrir ajustes",
    settingsCmd: "root@auditia:~# settings --edit",
  },
  en: {
    analysis: "Analysis",
    roadmaps: "Roadmaps",
    settings: "Settings",
    close: "Close",
    theme: "Theme",
    language: "Language",
    changeTheme: "Change theme",
    changeLanguage: "Change language",
    spanish: "Spanish",
    english: "English",
    openSettings: "Open settings",
    settingsCmd: "root@auditia:~# settings --edit",
  },
} as const;

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

const NAV_ITEMS = [
  {
    id: "dashboard",
    href: "/",
    label: {
      es: I18N.es.analysis,
      en: I18N.en.analysis,
    },
    icon: (
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "roadmaps",
    href: "/roadmaps",
    label: {
      es: I18N.es.roadmaps,
      en: I18N.en.roadmaps,
    },
    icon: (
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="square"
          strokeLinejoin="miter"
          d="M4 4h16v16H4zM8 9h8M8 13h6"
        />
      </svg>
    ),
  },
];

const EXPANDED_W = "15rem";
const COLLAPSED_W = "3.5rem";

export function Sidebar() {
  const initialCollapsed = useSidebarInitialCollapsed();
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    const rawStored = localStorage.getItem(THEME_KEY);
    const resolvedTheme: ThemeMode =
      rawStored === "light" || rawStored === "dark"
        ? rawStored
        : document.documentElement.getAttribute("data-theme") === "light"
          ? "light"
          : document.documentElement.getAttribute("data-theme") === "dark"
            ? "dark"
            : window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light";
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    localStorage.setItem(THEME_KEY, resolvedTheme);
    document.cookie = `${THEME_KEY}=${resolvedTheme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
    return resolvedTheme;
  });
  const language = useAppLanguage();

  const collapsed = useSyncExternalStore(
    subscribeStorage,
    () => {
      const raw = localStorage.getItem(SIDEBAR_KEY);
      if (raw === null) return initialCollapsed;
      return raw === "true";
    },
    () => initialCollapsed,
  );
  const pathname = usePathname();
  const t = I18N[language];

  // Keep CSS variable in sync with collapsed state
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      collapsed ? COLLAPSED_W : EXPANDED_W,
    );
  }, [collapsed]);

  useEffect(() => {
    if (!showSettings) return;

    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") setShowSettings(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSettings]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    document.cookie = `${THEME_KEY}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
  }, [theme]);

  function toggle() {
    const next = !collapsed;
    localStorage.setItem(SIDEBAR_KEY, String(next));
    document.cookie = `sidebar-collapsed=${String(next)}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
    window.dispatchEvent(new StorageEvent("storage"));
  }

  function setThemeMode(nextTheme: ThemeMode) {
    setTheme(nextTheme);
  }

  function setLanguageMode(nextLanguage: "es" | "en") {
    setAppLanguage(nextLanguage);
  }

  return (
    <aside
      suppressHydrationWarning
      className="fixed left-0 top-0 bottom-0 z-50 flex flex-col"
      style={{
        width: collapsed ? COLLAPSED_W : EXPANDED_W,
        backgroundColor: "var(--surface)",
        borderRight: "1px solid var(--surface-high)",
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* ── Brand ────────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4"
        style={{
          height: "3rem",
          borderBottom: "1px solid var(--surface-high)",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <Image
              src="/AuditIA.svg"
              alt="AuditIA"
              width={22}
              height={22}
              style={{ flexShrink: 0, width: 22, height: 22 }}
            />
            <span
              className="text-sm font-black tracking-widest uppercase"
              style={{
                color: "var(--primary)",
                fontFamily: "var(--font-space-grotesk), sans-serif",
              }}
            >
              AUDIT
              <span style={{ color: "var(--text)", opacity: 0.6 }}>_IA</span>
            </span>
          </div>
        )}

        <button
          onClick={toggle}
          className="flex items-center justify-center shrink-0 transition-all duration-150"
          style={{
            width: 26,
            height: 26,
            color: "var(--text-dim)",
            border: "1px solid var(--outline)",
            backgroundColor: "transparent",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--primary)";
            e.currentTarget.style.borderColor = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-dim)";
            e.currentTarget.style.borderColor = "var(--outline)";
          }}
          aria-label={
            collapsed
              ? language === "en"
                ? "Expand"
                : "Expandir"
              : language === "en"
                ? "Collapse"
                : "Colapsar"
          }
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            style={{
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* ── Nav items ────────────────────────────────────────────────────────── */}
      <nav className="flex flex-col flex-1 gap-0.5 p-2 pt-3">
        {NAV_ITEMS.map(({ id, href, label, icon }) => {
          const active = pathname === href;
          const itemLabel = label[language];
          return (
            <Link
              key={id}
              href={href}
              title={collapsed ? itemLabel : undefined}
              className="flex items-center gap-3 transition-all duration-150"
              style={{
                padding: collapsed ? "0.65rem 0" : "0.6rem 0.875rem",
                justifyContent: collapsed ? "center" : "flex-start",
                color: active ? "var(--primary-on)" : "var(--text-dim)",
                backgroundColor: active ? "var(--primary)" : "transparent",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: active ? 700 : 400,
                borderLeft: active
                  ? "2px solid rgba(255,255,255,0.3)"
                  : "2px solid transparent",
                boxShadow: active ? "0 0 20px rgba(107,255,143,0.08)" : "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "var(--text-dim)";
              }}
            >
              {icon}
              {!collapsed && (
                <span className="flex items-baseline gap-1.5">
                  <span style={{ opacity: active ? 0.5 : 0.3 }}>./</span>
                  {itemLabel}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom settings ─────────────────────────────────────────────────── */}
      <div
        className="shrink-0 p-2"
        style={{
          borderTop: "1px solid var(--surface-high)",
          paddingBottom: `calc(0.5rem + ${FOOTER_HEIGHT})`,
        }}
      >
        <button
          onClick={() => setShowSettings(true)}
          title={collapsed ? t.settings : undefined}
          className="flex items-center gap-3 transition-all duration-150 w-full"
          style={{
            padding: collapsed ? "0.65rem 0" : "0.6rem 0.875rem",
            justifyContent: collapsed ? "center" : "flex-start",
            color: "var(--text-dim)",
            backgroundColor: "transparent",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            borderLeft: "2px solid transparent",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--primary)";
            e.currentTarget.style.backgroundColor = "var(--surface-high)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-dim)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          aria-label={t.openSettings}
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            <circle cx="9" cy="6" r="2" fill="var(--surface)" />
            <circle cx="15" cy="12" r="2" fill="var(--surface)" />
            <circle cx="11" cy="18" r="2" fill="var(--surface)" />
          </svg>
          {!collapsed && (
            <span className="flex items-baseline gap-1.5">
              <span style={{ opacity: 0.3 }}>./</span>
              {t.settings}
            </span>
          )}
        </button>
      </div>

      {showSettings && (
        <div
          className="fixed inset-0 z-90"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowSettings(false)}
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,34rem)]"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--surface-high)",
              borderLeft: "2px solid var(--primary)",
              boxShadow:
                "0 0 60px rgba(0,0,0,0.35), 0 0 22px rgba(107,255,143,0.1)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t.settings}
          >
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                borderBottom: "1px solid var(--surface-high)",
                backgroundColor: "var(--surface-high)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  style={{ color: "#0cce6b", opacity: 0.65, fontSize: "11px" }}
                >
                  {"//"}
                </span>
                <span
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: "var(--primary)" }}
                >
                  {t.settings}
                </span>
              </div>
              <button
                className="text-[10px] px-2 py-1 uppercase tracking-[0.12em]"
                style={{
                  color: "var(--text-dim)",
                  border: "1px solid var(--outline)",
                }}
                onClick={() => setShowSettings(false)}
              >
                {t.close}
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <div
                className="text-[10px] tracking-[0.16em] uppercase"
                style={{ color: "var(--text-dim)", opacity: 0.75 }}
              >
                {t.settingsCmd}
              </div>

              <div
                className="px-4 py-4"
                style={{
                  border: "1px solid var(--surface-high)",
                  backgroundColor: "var(--surface-high)",
                }}
              >
                <div
                  className="text-[11px] tracking-[0.14em] uppercase mb-3"
                  style={{ color: "var(--text)" }}
                >
                  {t.theme}
                </div>
                <div
                  className="flex items-center gap-2"
                  role="group"
                  aria-label={t.changeTheme}
                >
                  {(
                    [
                      {
                        key: "light",
                        label: language === "en" ? "Light" : "Claro",
                      },
                      {
                        key: "dark",
                        label: language === "en" ? "Dark" : "Oscuro",
                      },
                    ] as const
                  ).map((opt) => {
                    const active = theme === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setThemeMode(opt.key)}
                        className="px-3 py-2 text-[10px] uppercase tracking-[0.14em]"
                        style={{
                          color: active
                            ? "var(--primary-on)"
                            : "var(--text-dim)",
                          backgroundColor: active
                            ? "var(--primary)"
                            : "var(--surface)",
                          border: "1px solid",
                          borderColor: active
                            ? "transparent"
                            : "var(--outline)",
                          boxShadow: active
                            ? "0 0 16px rgba(107,255,143,0.22)"
                            : "none",
                        }}
                        aria-pressed={active}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="text-[11px] tracking-[0.14em] uppercase mt-4 mb-3"
                  style={{ color: "var(--text)" }}
                >
                  {t.language}
                </div>
                <div
                  className="flex items-center gap-2"
                  role="group"
                  aria-label={t.changeLanguage}
                >
                  {(
                    [
                      { key: "es", label: t.spanish },
                      { key: "en", label: t.english },
                    ] as const
                  ).map((opt) => {
                    const active = language === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setLanguageMode(opt.key)}
                        className="px-3 py-2 text-[10px] uppercase tracking-[0.14em]"
                        style={{
                          color: active
                            ? "var(--primary-on)"
                            : "var(--text-dim)",
                          backgroundColor: active
                            ? "var(--primary)"
                            : "var(--surface)",
                          border: "1px solid",
                          borderColor: active
                            ? "transparent"
                            : "var(--outline)",
                          boxShadow: active
                            ? "0 0 16px rgba(107,255,143,0.22)"
                            : "none",
                        }}
                        aria-pressed={active}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
