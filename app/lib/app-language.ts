"use client";

import { useEffect, useState } from "react";

export type AppLanguage = "es" | "en";

export const APP_LANG_KEY = "auditia-lang";
const APP_LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readBrowserLanguage(): AppLanguage {
  const raw = localStorage.getItem(APP_LANG_KEY);
  if (raw === "en" || raw === "es") return raw;
  return document.documentElement.lang === "en" ? "en" : "es";
}

export function useAppLanguage(): AppLanguage {
  // Keep SSR/first client render stable to avoid hydration mismatch.
  const [language, setLanguage] = useState<AppLanguage>("es");

  useEffect(() => {
    const syncLanguage = () => {
      setLanguage(readBrowserLanguage());
    };

    syncLanguage();
    window.addEventListener("storage", syncLanguage);
    return () => window.removeEventListener("storage", syncLanguage);
  }, []);

  return language;
}

export function setAppLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
  localStorage.setItem(APP_LANG_KEY, language);
  document.cookie = `${APP_LANG_KEY}=${language}; path=/; max-age=${APP_LANG_COOKIE_MAX_AGE}; samesite=lax`;
  window.dispatchEvent(new StorageEvent("storage"));
}
