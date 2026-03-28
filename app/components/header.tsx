"use client";
import { useState, useEffect } from "react";

export function Header() {
  const [time, setTime] = useState("");

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
      {/* Left — brand */}
      <div className="flex items-center gap-4 text-[11px] tracking-[0.2em] uppercase">
        <span className="font-black" style={{ color: "var(--primary)" }}>
          AUDIT_IA
        </span>
        <span style={{ opacity: 0.2 }}>|</span>
        <span style={{ color: "var(--text-dim)", opacity: 0.6 }}>v1.0.0</span>
      </div>

      {/* Center — live clock easter egg */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] tracking-[0.2em]"
        style={{ color: "var(--text-dim)", opacity: 0.4 }}
        title="Hora del sistema"
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
