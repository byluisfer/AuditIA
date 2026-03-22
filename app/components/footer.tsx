export function Footer() {
  return (
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
          <a
            href="#"
            className="underline underline-offset-2 hover:text-(--primary) transition-colors duration-150"
          >
            Documentación
          </a>
          <a
            href="#"
            className="underline underline-offset-2 hover:text-(--primary) transition-colors duration-150"
          >
            API_REF
          </a>
        </div>
      </div>
    </footer>
  );
}
