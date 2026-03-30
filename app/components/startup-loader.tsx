"use client";

import { useEffect, useState } from "react";
import { useAppLanguage } from "../lib/app-language";

const MIN_VISIBLE_MS = 3500;
const MAX_VISIBLE_MS = 6000;

const BOOT_LINES = {
  es: [
    { delay: 200, text: "Iniciando runtime de AuditIA..." },
    { delay: 600, text: "Cargando motor de auditoria v2.4.1" },
    { delay: 1000, text: "Conectando con base de conocimiento..." },
    { delay: 1500, text: "Montando marcos regulatorios [OK]" },
    { delay: 2000, text: "Validando modulos de seguridad... [OK]" },
    { delay: 2500, text: "Iniciando capa de inferencia IA..." },
    { delay: 3000, text: "Sistema listo." },
  ],
  en: [
    { delay: 200, text: "Initializing AuditIA runtime..." },
    { delay: 600, text: "Loading audit engine v2.4.1" },
    { delay: 1000, text: "Connecting to knowledge base..." },
    { delay: 1500, text: "Mounting regulatory frameworks [OK]" },
    { delay: 2000, text: "Validating security modules... [OK]" },
    { delay: 2500, text: "Starting AI inference layer..." },
    { delay: 3000, text: "System ready." },
  ],
} as const;

export function StartupLoader() {
  const language = useAppLanguage();
  const bootLines = BOOT_LINES[language];
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  // Animate progress bar
  useEffect(() => {
    const duration = MIN_VISIBLE_MS;
    const interval = 30;
    const steps = duration / interval;
    let step = 0;

    const timer = window.setInterval(() => {
      step++;
      const raw = step / steps;
      // Ease-out: fast start, slow end
      const eased = 1 - Math.pow(1 - raw, 2);
      setProgress(Math.min(eased * 100, 97)); // cap at 97 until truly done
      if (step >= steps) window.clearInterval(timer);
    }, interval);

    return () => window.clearInterval(timer);
  }, []);

  // Reveal boot lines one by one
  useEffect(() => {
    const timers = bootLines.map((line, i) =>
      window.setTimeout(() => {
        setVisibleLines((prev) => [...prev, i]);
      }, line.delay),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [bootLines]);

  // Page ready detection
  useEffect(() => {
    let unmounted = false;
    const start = Date.now();

    const onReady = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        if (!unmounted) setReady(true);
      }, wait);
    };

    if (document.readyState === "complete") {
      onReady();
    } else {
      window.addEventListener("load", onReady, { once: true });
    }

    const safety = window.setTimeout(() => {
      if (!unmounted) setReady(true);
    }, MAX_VISIBLE_MS);

    return () => {
      unmounted = true;
      window.clearTimeout(safety);
      window.removeEventListener("load", onReady);
    };
  }, []);

  // Fade out when ready
  useEffect(() => {
    if (!ready) return;
    setProgress(100);
    const t = window.setTimeout(() => {
      setFadingOut(true);
      const t2 = window.setTimeout(() => setVisible(false), 500);
      return () => window.clearTimeout(t2);
    }, 200);
    return () => window.clearTimeout(t);
  }, [ready]);

  if (!visible) return null;

  return (
    <div
      className={`startup-loader ${fadingOut ? "startup-loader-out" : ""}`}
      aria-label={language === "en" ? "Loading AuditIA" : "Cargando AuditIA"}
    >
      <div className="startup-inner">
        {/* Spinning logo */}
        <div className="startup-cube" aria-hidden="true">
          <img
            src="/Cubepath.svg"
            alt="AuditIA"
            className="startup-cube-logo"
          />
        </div>

        {/* Terminal panel */}
        <div className="startup-terminal" aria-live="polite">
          <div className="startup-terminal-lines">
            {bootLines.map((line, i) => (
              <div
                key={i}
                className={`startup-terminal-line ${visibleLines.includes(i) ? "startup-line-visible" : ""}`}
              >
                <span className="startup-prompt">▸</span>
                <span className="startup-line-text">{line.text}</span>
                {i === visibleLines[visibleLines.length - 1] && !ready && (
                  <span className="startup-cursor" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="startup-progress-wrap" aria-hidden="true">
            <div
              className="startup-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="startup-progress-label">{Math.round(progress)}%</div>
        </div>
      </div>
    </div>
  );
}
