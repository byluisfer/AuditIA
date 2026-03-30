"use client";

import { useSyncExternalStore } from "react";

export type AppLanguage = "es" | "en";

export const APP_LANG_KEY = "auditia-lang";
const APP_LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getLanguageSnapshot(): AppLanguage {
  const raw = localStorage.getItem(APP_LANG_KEY);
  if (raw === "en" || raw === "es") return raw;
  return document.documentElement.lang === "en" ? "en" : "es";
}

export function useAppLanguage(): AppLanguage {
  return useSyncExternalStore(
    subscribeStorage,
    getLanguageSnapshot,
    () => "es",
  );
}

export function setAppLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
  localStorage.setItem(APP_LANG_KEY, language);
  document.cookie = `${APP_LANG_KEY}=${language}; path=/; max-age=${APP_LANG_COOKIE_MAX_AGE}; samesite=lax`;
  window.dispatchEvent(new StorageEvent("storage"));
}
