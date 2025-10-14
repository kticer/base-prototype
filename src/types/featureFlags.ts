/**
 * Feature Flag System for Experimental Features
 */

export interface FeatureFlag {
  /** Unique identifier for the feature */
  id: string;
  /** Display name for the feature */
  name: string;
  /** Description of what the feature does */
  description: string;
  /** Current enabled/disabled state */
  enabled: boolean;
  /** Category for grouping features */
  category: "comments" | "grading" | "ui" | "navigation" | "experimental";
  /** Development status */
  status: "alpha" | "beta" | "stable" | "deprecated";
  /** Optional implementation notes for developers */
  notes?: string;
  /** Date when feature was added */
  addedDate: string;
}

export interface FeatureFlagState {
  /** All available feature flags */
  flags: Record<string, FeatureFlag>;
  /** Whether feature flags panel is open */
  panelOpen: boolean;
  /** Last modified timestamp */
  lastModified: string;
}

/** Predefined feature flags with their configurations */
export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  reusableComments: {
    id: "reusableComments",
    name: "Reusable Comments",
    description: "Shows a bank of common feedback comments during comment creation, allowing users to select from previously used comments",
    enabled: false,
    category: "comments",
    status: "alpha",
    notes: "Experimental feature for improving comment efficiency during grading workflows",
    addedDate: "2025-01-10",
  },
  modernCommentCards: {
    id: "modernCommentCards",
    name: "Modern Comment Cards",
    description: "Updated comment card design with rich text editor, QuickMark integration, and professional styling that matches the production application",
    enabled: true,
    category: "comments",
    status: "beta",
    notes: "Redesigned comment interface to match production fidelity",
    addedDate: "2025-01-09",
  },
  badgeAnimations: {
    id: "badgeAnimations",
    name: "Badge Animations",
    description: "Elegant animations for similarity badges in document margins with smooth transitions and hover effects",
    enabled: true,
    category: "ui",
    status: "stable",
    notes: "Polished animation system for document margin badges",
    addedDate: "2025-01-08",
  },
  bidirectionalSync: {
    id: "bidirectionalSync",
    name: "Bidirectional Sync",
    description: "Synchronizes highlights and match cards so selecting one automatically updates the other, with carousel navigation",
    enabled: true,
    category: "navigation",
    status: "stable",
    notes: "Core navigation feature ensuring highlights and match cards stay in sync",
    addedDate: "2025-01-07",
  },
};

/** Helper type for feature flag IDs */
export type FeatureFlagId = keyof typeof DEFAULT_FEATURE_FLAGS;

/** Helper to check if a feature is enabled */
export function isFeatureEnabled(flags: Record<string, FeatureFlag>, featureId: FeatureFlagId): boolean {
  return flags[featureId]?.enabled ?? false;
}

/** Helper to get feature flag by ID */
export function getFeatureFlag(flags: Record<string, FeatureFlag>, featureId: FeatureFlagId): FeatureFlag | undefined {
  return flags[featureId];
}

/** Helper to group features by category */
export function groupFeaturesByCategory(flags: Record<string, FeatureFlag>): Record<string, FeatureFlag[]> {
  const grouped: Record<string, FeatureFlag[]> = {};
  
  Object.values(flags).forEach(flag => {
    if (!grouped[flag.category]) {
      grouped[flag.category] = [];
    }
    grouped[flag.category].push(flag);
  });
  
  return grouped;
}