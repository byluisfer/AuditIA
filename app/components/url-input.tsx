"use client";

import { useState, useRef } from "react";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex items-center gap-4 px-6 py-5 mb-4 cursor-text"
      style={{ backgroundColor: "var(--surface-high)" }}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-xl select-none shrink-0" style={{ color: "var(--primary)" }}>
        $
      </span>

      <div className="relative flex-1 flex items-center min-w-0 overflow-hidden text-base">
        <div className="flex items-center min-w-0 pointer-events-none select-none whitespace-pre">
          {url ? (
            <>
              <span style={{ color: "var(--text)" }}>{url}</span>
              <span
                className="cursor-blink shrink-0 inline-block w-[0.55em] h-[1.15em] translate-y-px"
                style={{ backgroundColor: "var(--primary)" }}
              />
            </>
          ) : (
            <>
              <span
                className="cursor-blink shrink-0 inline-block w-[0.55em] h-[1.15em] translate-y-px mr-1"
                style={{ backgroundColor: "var(--primary)" }}
              />
              <span style={{ color: "var(--text-dim)" }}>https://tu-web.com</span>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="absolute inset-0 w-full opacity-0 cursor-text"
          style={{ fontFamily: "inherit" }}
        />
      </div>
    </div>
  );
}
