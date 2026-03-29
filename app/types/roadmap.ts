export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  priority: "alta" | "media" | "baja";
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
  strategy: string;
  createdAt: string;
  summary: string;
  categories: CategoryRoadmap[];
};
