"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    id: "dashboard",
    href: "/",
    label: "Dashboard",
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
    id: "logs",
    href: "/logs",
    label: "Registros",
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
  {
    id: "analytics",
    href: "/analytics",
    label: "Analíticas",
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
          d="M4 20h16M4 20V10l6-4 4 4 6-6"
        />
      </svg>
    ),
  },
];

const EXPANDED_W = "15rem";
const COLLAPSED_W = "3.5rem";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      collapsed ? COLLAPSED_W : EXPANDED_W,
    );
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed") === "true";
    document.documentElement.style.setProperty(
      "--sidebar-w",
      saved ? COLLAPSED_W : EXPANDED_W,
    );
  }, []);

  return (
    <aside
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
          height: "3.5rem",
          borderBottom: "1px solid var(--surface-high)",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {!collapsed && (
          <div className="flex items-baseline gap-2 min-w-0">
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
            <span
              className="text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "var(--text-dim)", opacity: 0.3 }}
            >
              v1.0.0
            </span>
          </div>
        )}

        <button
          onClick={() => setCollapsed((c) => !c)}
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
          aria-label={collapsed ? "Expandir" : "Colapsar"}
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
          return (
            <Link
              key={id}
              href={href}
              title={collapsed ? label : undefined}
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
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom dot ───────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-center pb-4"
        style={{
          borderTop: "1px solid var(--surface-high)",
          paddingTop: "0.875rem",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: "#0cce6b",
            boxShadow: "0 0 6px #0cce6b",
          }}
        />
      </div>
    </aside>
  );
}
