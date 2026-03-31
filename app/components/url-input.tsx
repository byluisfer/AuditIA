"use client";

import { useRef, useState } from "react";
import { useAppLanguage } from "../lib/app-language";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function UrlInput({ value: url, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const language = useAppLanguage();

  const showCursor = focused || url.length > 0;

  return (
    <div
      className="flex items-center gap-4 px-6 py-5 mb-4 cursor-text"
      style={{
        backgroundColor: "var(--surface-high)",
        outline: focused ? "1px solid var(--primary)" : "none",
        outlineOffset: "-1px",
        transition: "outline 0.15s ease",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <span
        className="text-xl select-none shrink-0"
        style={{ color: "var(--primary)" }}
      >
        $
      </span>

      <div className="relative flex-1 flex items-center min-w-0 overflow-hidden text-base">
        <div className="flex items-center min-w-0 pointer-events-none select-none whitespace-pre">
          {/* Keep constant width so placeholder never shifts on focus */}
          <span
            className={`shrink-0 inline-block w-[0.55em] h-[1.15em] translate-y-px mr-1 ${focused ? "cursor-blink" : ""}`}
            style={{
              backgroundColor: "var(--primary)",
              opacity: showCursor ? 1 : 0,
            }}
          />
          {url ? (
            <>
              <span style={{ color: "var(--text)" }}>{url}</span>
            </>
          ) : (
            <span style={{ color: "var(--text-dim)" }}>
              {language === "en"
                ? "https://your-site.com"
                : "https://tu-web.com"}
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className="absolute inset-0 w-full opacity-0 cursor-text disabled:cursor-not-allowed"
          style={{ fontFamily: "inherit" }}
          suppressHydrationWarning
        />
      </div>
    </div>
  );
}
