export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  priority: "alta" | "media" | "baja" | "high" | "medium" | "low";
  estimatedImpact: string;
  checked: boolean;
  /** ISO timestamp when this item was marked as fixed (score reached 100%) */
  fixedAt?: string;
};

export type CategoryRoadmap = {
  category: "performance" | "accessibility" | "seo" | "bestPractices";
  currentScore: number;
  targetScore: 100;
  objective: string;
  steps: ChecklistItem[];
};

export type Roadmap = {
  id: string;
  url: string;
  strategy: "desktop" | "mobile";
  language?: "es" | "en";
  createdAt: string;
  summary: string;
  categories: CategoryRoadmap[];
  /** All 4 Lighthouse scores at the time the roadmap was generated */
  scores?: {
    performance: number;
    accessibility: number;
    seo: number;
    bestPractices: number;
  };
  /** Scores from the previous analysis run — used to show deltas */
  previousScores?: {
    performance: number;
    accessibility: number;
    seo: number;
    bestPractices: number;
  };
  /** ISO timestamp of the last re-analysis */
  reanalyzedAt?: string;
};
