export function Header() {
  return (
    <header
      className="fixed top-0 inset-x-0 z-60 h-12 flex items-center justify-between px-6"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <nav
        className="flex items-center gap-8 text-[11px] tracking-[0.18em] uppercase"
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
        <span className="font-black" style={{ color: "var(--primary)" }}>
          AUDIT_IA
        </span>
        <a href="#" className="font-bold transition-colors" style={{ color: "var(--primary)" }}>
          Consola
        </a>
        <a
          href="#"
          className="transition-colors hover:text-(--primary)"
          style={{ color: "var(--text-dim)" }}
        >
          Red
        </a>
        <a
          href="#"
          className="transition-colors hover:text-(--primary)"
          style={{ color: "var(--text-dim)" }}
        >
          Archivo
        </a>
      </nav>

      <div className="flex items-center gap-4" style={{ color: "var(--secondary)" }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 20.25h.008v.008H12v-.008z"
          />
        </svg>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
    </header>
  );
}
