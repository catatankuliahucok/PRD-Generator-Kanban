/**
 * Shared Type Definitions for AI Software Blueprint Studio
 */

export interface QuestionnaireAnswers {
  appName: string;
  appConcept: string;
  targetUsers: string[];
  platform: string;
  coreModules: string[];
  monetization: string;
  visualStyle: string;
  customComments: string;
}

export interface MindmapNode {
  id: string;
  label: string;
  type: "root" | "module" | "subfeature";
  phase?: "Fase 1" | "Fase 2" | string;
  parentId?: string;
  x?: number; // Position X on interactive canvas
  y?: number; // Position Y on interactive canvas
}

export interface MindmapEdge {
  id?: string;
  source: string;
  target: string;
}

export interface MindmapData {
  appName: string;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

export interface VibeTask {
  id: string;
  title: string;
  layer: "Database Schema" | "Backend API" | "Frontend UI" | "Integration" | string;
  description: string;
  prompt: string;
  completed?: boolean; // Client-side tracking
  status?: "todo" | "in_progress" | "done" | string; // Optional status for Kanban
}

export interface AppState {
  step: "wizard" | "mindmap" | "prd" | "tasks";
  answers: QuestionnaireAnswers;
  mindmap: MindmapData | null;
  prdMarkdown: string | null;
  tasks: VibeTask[] | null;
}
