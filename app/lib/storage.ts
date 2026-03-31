import type { Roadmap } from "../types/roadmap";

const STORAGE_KEY = "auditia-roadmaps";
const MAX_ROADMAPS = 20;

type Strategy = "desktop" | "mobile";

export function normalizeRoadmapUrl(rawUrl: string): string {
  const withProtocol = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `https://${rawUrl}`;

  try {
    const parsed = new URL(withProtocol);
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }
    return parsed.toString();
  } catch {
    return withProtocol.trim().toLowerCase().replace(/\/+$/, "");
  }
}

function normalizeRoadmapStrategy(rawStrategy: string): Strategy {
  return rawStrategy === "mobile" ? "mobile" : "desktop";
}

function roadmapMatchesTarget(
  item: Roadmap,
  normalizedUrl: string,
  strategy?: Strategy,
): boolean {
  const itemMatchesUrl = normalizeRoadmapUrl(item.url) === normalizedUrl;
  if (!itemMatchesUrl) return false;
  if (!strategy) return true;
  return normalizeRoadmapStrategy(item.strategy) === strategy;
}

function notify() {
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

export function getRoadmaps(): Roadmap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function findRoadmapByUrl(url: string): Roadmap | undefined {
  const normalizedTarget = normalizeRoadmapUrl(url);
  return getRoadmaps().find((item) =>
    roadmapMatchesTarget(item, normalizedTarget),
  );
}

export function findRoadmapByUrlAndStrategy(
  url: string,
  strategy: Strategy,
  language?: "es" | "en",
): Roadmap | undefined {
  const normalizedTarget = normalizeRoadmapUrl(url);
  return getRoadmaps().find((item) => {
    if (!roadmapMatchesTarget(item, normalizedTarget, strategy)) return false;
    // If language is specified, only reuse roadmaps generated in the same language.
    // Roadmaps without a stored language are treated as Spanish (legacy default).
    if (language) {
      const itemLang = item.language ?? "es";
      if (itemLang !== language) return false;
    }
    return true;
  });
}

export function saveRoadmap(roadmap: Roadmap): string {
  const list = getRoadmaps();

  const normalizedTarget = normalizeRoadmapUrl(roadmap.url);
  const strategy = normalizeRoadmapStrategy(roadmap.strategy);
  const existingIdx = list.findIndex((item) =>
    roadmapMatchesTarget(item, normalizedTarget, strategy),
  );

  if (existingIdx !== -1) {
    // Reuse existing roadmap id for a stable reference in UI.
    const existing = list[existingIdx];
    list.splice(existingIdx, 1);
    list.unshift({
      ...roadmap,
      id: existing.id,
      createdAt: existing.createdAt,
    });
  } else {
    list.unshift(roadmap);
  }

  if (list.length > MAX_ROADMAPS) list.length = MAX_ROADMAPS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  notify();

  return list[0].id;
}

export function updateRoadmap(
  id: string,
  updater: (r: Roadmap) => Roadmap,
): void {
  const list = getRoadmaps();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return;
  list[idx] = updater(list[idx]);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  notify();
}

export function deleteRoadmap(id: string): void {
  const list = getRoadmaps().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  notify();
}
