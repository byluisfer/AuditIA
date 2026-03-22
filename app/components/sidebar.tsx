import type { ReactNode } from "react";

type NavItem = {
  label: string;
  active?: boolean;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Panel",
    active: true,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Red",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path strokeLinecap="square" d="M12 7v4M12 11l-5 6M12 11l5 6" />
      </svg>
    ),
  },
  {
    label: "Registros",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M4 4h16v16H4zM8 9h8M8 13h6" />
      </svg>
    ),
  },
  {
    label: "Seguridad",
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 3l8 4v5c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V7l8-4z" />
      </svg>
    ),
  },
];

const bottomItems: NavItem[] = [
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

const navLinkStyle: React.CSSProperties = {
  color: "var(--text-dim)",
  fontFamily: "var(--font-inter), sans-serif",
};

const navLinkActiveStyle: React.CSSProperties = {
  backgroundColor: "var(--primary)",
  color: "var(--primary-on)",
  fontFamily: "var(--font-inter), sans-serif",
  fontWeight: 700,
};

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 z-60 w-60 flex flex-col"
      style={{ top: "3rem", bottom: "2rem", backgroundColor: "var(--surface)" }}
    >
      <div className="px-5 py-5">
        <div
          className="text-sm font-black tracking-[0.15em] uppercase"
          style={{ color: "var(--primary)", fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          TERMINAL V1.0
        </div>
        <div
          className="text-[10px] tracking-[0.2em] uppercase mt-1"
          style={{ color: "var(--secondary)" }}
        >
          SISTEMA_ESTABLE
        </div>
      </div>

      <nav className="flex flex-col flex-1">
        {navItems.map(({ label, active, icon }) => (
          <a
            key={label}
            href="#"
            className="flex items-center gap-3 px-5 py-3.5 text-[11px] tracking-[0.18em] uppercase transition-colors duration-150"
            style={active ? navLinkActiveStyle : navLinkStyle}
          >
            {icon}
            <span>&gt; {label}</span>
          </a>
        ))}
      </nav>

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
  );
}
