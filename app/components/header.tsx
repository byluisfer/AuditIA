"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  "/": "dashboard",
  "/roadmaps": "roadmaps",
  "/analytics": "analytics",
};

export function Header() {
  const [time, setTime] = useState("");
  const pathname = usePathname();
  const page = ROUTE_LABELS[pathname] ?? pathname.replace("/", "");

  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString("es-ES", { hour12: false }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="fixed top-0 inset-x-0 z-60 h-12 flex items-center justify-between px-6"
      style={{
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--surface-high)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
      }}
    >
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase">
        <span style={{ color: "var(--text-dim)", opacity: 0.4 }}>~/</span>
        <span style={{ color: "var(--primary)" }}>{page}</span>
        <span
          className="cursor-blink inline-block translate-y-px"
          style={{
            width: "0.45em",
            height: "0.85em",
            backgroundColor: "var(--primary)",
            opacity: 0.7,
          }}
        />
      </div>

      {/* Center — live clock */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase"
        style={{ color: "var(--text-dim)", opacity: 0.35 }}
      >
        <span>SYS_TIME:</span>
        <span style={{ color: "var(--primary)", opacity: 1 }}>{time}</span>
      </div>

      {/* Right — status indicators */}
      <div className="flex items-center gap-4 text-[10px] tracking-[0.15em] uppercase">
        <div
          className="flex items-center gap-1.5"
          style={{ color: "var(--text-dim)", opacity: 0.5 }}
        >
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#0cce6b",
              boxShadow: "0 0 6px #0cce6b",
            }}
          />
          <span>ONLINE</span>
        </div>
        <span style={{ opacity: 0.2 }}>|</span>
        <div
          className="flex items-center gap-1.5"
          style={{ color: "var(--text-dim)", opacity: 0.5 }}
        >
          <span>ENC:</span>
          <span style={{ color: "var(--primary)" }}>AES_256</span>
        </div>
      </div>
    </header>
  );
}
