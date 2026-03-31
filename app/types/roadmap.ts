export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  priority: "alta" | "media" | "baja" | "high" | "medium" | "low";
  estimatedImpact: string;
  checked: boolean;
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
};
