// ─── Project registry ─────────────────────────────────────────────────────────
// Each project implements ProjectDefinition. The registry maps slugs → definitions.

export interface ParamMeta {
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: string;
}

export interface ProjectDefinition {
  slug: string;
  name: string;
  description: string;   // Czech text for homepage card
  version: string;
  color: string;          // accent color for card
  computeModel: (city: Record<string, unknown>) => Record<string, number>;
  paramMeta: Record<string, ParamMeta>;
  presetCities: { name: string; [key: string]: unknown }[];
  paramGroups: string[];  // ordered group names for slider sections
  /** Column definitions for the Compare tab. If not provided, Compare tab is hidden. */
  compareColumns?: {
    key: string;
    label: string;
    fmt: 'num' | 'czk' | 'pct' | 'text';
    decimals?: number;
    align: 'left' | 'right';
  }[];
  /** If true, show Charts tab (model-specific charts are rendered inline). Defaults to false. */
  hasCharts?: boolean;
}

// ─── Import project definitions ──────────────────────────────────────────────

import { clearwayProject } from './clearway';
import { dalrisProject } from './dalris';

export const PROJECT_REGISTRY: Record<string, ProjectDefinition> = {
  clearway: clearwayProject,
  dalris: dalrisProject,
};

export const PROJECT_SLUGS = Object.keys(PROJECT_REGISTRY);

export function getProject(slug: string): ProjectDefinition | undefined {
  return PROJECT_REGISTRY[slug];
}
