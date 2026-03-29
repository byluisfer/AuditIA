import type { Roadmap } from "../types/roadmap";

const STORAGE_KEY = "auditia-roadmaps";
const MAX_ROADMAPS = 20;

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

export function saveRoadmap(roadmap: Roadmap): void {
  const list = getRoadmaps();
  list.unshift(roadmap);
  if (list.length > MAX_ROADMAPS) list.length = MAX_ROADMAPS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  notify();
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
