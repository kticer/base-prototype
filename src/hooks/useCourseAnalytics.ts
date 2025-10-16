/**
 * Hooks for accessing course analytics (Story 2: Hero's Journey)
 */

import { useStore } from '../store';
import { useEffect } from 'react';
import type {
  CourseAnalytics,
  StudentPattern,
  InterventionRecommendation,
} from '../types/courseAnalytics';

/**
 * Hook to access course-wide analytics
 * Automatically loads analytics on mount if not already loaded
 */
export function useCourseAnalytics(autoLoad = true): {
  analytics: CourseAnalytics | null;
  loading: boolean;
  load: () => Promise<void>;
  refresh: () => void;
  exportCSV: () => string;
} {
  const analytics = useStore((state) => state.courseAnalytics);
  const loading = useStore((state) => state.courseAnalyticsLoading);
  const load = useStore((state) => state.loadCourseAnalytics);
  const refresh = useStore((state) => state.refreshCourseAnalytics);
  const exportCSV = useStore((state) => state.exportCourseAnalyticsCSV);

  useEffect(() => {
    if (autoLoad && !analytics && !loading) {
      load();
    }
  }, [autoLoad, analytics, loading, load]);

  return {
    analytics,
    loading,
    load,
    refresh,
    exportCSV,
  };
}

/**
 * Hook to access student patterns and interventions
 */
export function useStudentInterventions(): {
  patterns: StudentPattern[];
  recommendations: InterventionRecommendation[];
  loading: boolean;
  exportCSV: () => string;
} {
  const patterns = useStore((state) => state.studentPatterns);
  const recommendations = useStore((state) => state.interventionRecommendations);
  const loading = useStore((state) => state.courseAnalyticsLoading);
  const exportCSV = useStore((state) => state.exportInterventionsCSV);

  return {
    patterns,
    recommendations,
    loading,
    exportCSV,
  };
}

/**
 * Hook to get students needing intervention (high priority first)
 */
export function useHighPriorityInterventions(): InterventionRecommendation[] {
  const recommendations = useStore((state) => state.interventionRecommendations);
  return recommendations.filter((r) => r.priority === 'high');
}

/**
 * Hook to get course statistics for dashboard
 */
export function useCourseStats() {
  const analytics = useStore((state) => state.courseAnalytics);

  if (!analytics) {
    return {
      totalSubmissions: 0,
      averageSimilarity: 0,
      highRiskCount: 0,
      integrityIssuesCount: 0,
      properCitationRate: 0,
    };
  }

  return {
    totalSubmissions: analytics.totalSubmissions,
    averageSimilarity: analytics.averageSimilarity,
    highRiskCount: analytics.highRiskCount,
    integrityIssuesCount: analytics.integrityIssuesCount,
    properCitationRate: analytics.citationPatterns.properCitationRate,
  };
}

/**
 * Hook to get common sources for the course
 */
export function useCommonSources() {
  const analytics = useStore((state) => state.courseAnalytics);
  return analytics?.commonSources || [];
}

/**
 * Hook to get similarity distribution for charts
 */
export function useSimilarityDistribution() {
  const analytics = useStore((state) => state.courseAnalytics);
  return analytics?.similarityDistribution || [];
}
