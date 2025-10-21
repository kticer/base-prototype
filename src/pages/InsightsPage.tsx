import { useEffect, useMemo, useState } from 'react';
import { InboxNavBar } from '../components/inbox/InboxNavBar';
import InboxTabs from '../components/inbox/InboxTabs';
import { usePageTitle } from '../hooks/usePageTitle';
import type { FolderOrDocument } from '../types';
import GlobalChatPanel from '../components/chatbot/GlobalChatPanel';
import { PrototypeControls } from '../components/settings/PrototypeControls';
import { FeatureFlagsModal } from '../components/settings/FeatureFlagsModal';
import { useStore } from '../store';
import { useCourseAnalytics } from '../hooks/useCourseAnalytics';
import { CourseStatsCards } from '../components/insights/CourseStatsCards';
import { SimilarityDistributionChart } from '../components/insights/SimilarityDistributionChart';
import { CommonSourcesTable } from '../components/insights/CommonSourcesTable';
import { InterventionsTable } from '../components/insights/InterventionsTable';
import { ExportButtons } from '../components/insights/ExportButtons';

export default function InsightsPage() {
  usePageTitle('Insights – iThenticate Prototype');
  const { chat } = useStore();
  const { analytics, loading: analyticsLoading } = useCourseAnalytics(true);
  const [rootItems, setRootItems] = useState<FolderOrDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/data/folder_structure.json');
        if (!res.ok) throw new Error(`Failed to load folder structure: ${res.status}`);
        const data = await res.json();

        // Collect document metadata
        const extractDocs = (items: FolderOrDocument[]): { id: string }[] => {
          const list: { id: string }[] = [];
          for (const item of items) {
            if ((item as any).type === 'document') list.push({ id: (item as any).id });
            if ((item as any).type === 'folder' && (item as any).children) {
              list.push(...extractDocs((item as any).children));
            }
          }
          return list;
        };
        const docs = extractDocs(data);

        const meta: Array<{ id: string; title: string; author: string; similarity?: number }> = [];
        await Promise.all(
          docs.map(async (d) => {
            const r = await fetch(`/data/documents/${d.id}.json`);
            const t = await r.text();
            if (t.startsWith('<!DOCTYPE html')) return; // skip bad files in prototype
            try {
              const j = JSON.parse(t);
              meta.push({ id: d.id, title: j.title ?? 'Unknown', author: j.author ?? 'Unknown', similarity: j.similarity });
            } catch {
              // ignore parse errors in prototype
            }
          })
        );

        // Attach similarity if present at item level preferred
        setRootItems(data);
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    // flatten documents from tree
    const flatten = (items: FolderOrDocument[]): any[] =>
      items.flatMap((it: any) => (it.type === 'folder' ? flatten(it.children || []) : [ it ]));
    const docs = flatten(rootItems);

    const total = docs.length;
    const withSim = docs.filter((d: any) => typeof d.similarity === 'number');
    const avgSim = withSim.length ? Math.round((withSim.reduce((a: number, d: any) => a + (d.similarity || 0), 0) / withSim.length) * 10) / 10 : 0;

    // simple top sources aggregation from document-level similarity (placeholder)
    const distribution = [
      { label: '0–24%', count: withSim.filter((d: any) => d.similarity < 25).length },
      { label: '25–49%', count: withSim.filter((d: any) => d.similarity >= 25 && d.similarity < 50).length },
      { label: '50–74%', count: withSim.filter((d: any) => d.similarity >= 50 && d.similarity < 75).length },
      { label: '75–100%', count: withSim.filter((d: any) => d.similarity >= 75).length },
    ];

    return { total, avgSim, distribution };
  }, [rootItems]);

  // Compute metrics for chat context
  const insightsMetrics = useMemo(() => {
    if (!analytics) return null;

    // High priority interventions
    const highPriorityInterventions = analytics.integrityIssuesCount;
    const mediumPriorityCount = analytics.highRiskCount - analytics.integrityIssuesCount;

    // Top sources breakdown
    const topInternetSources = analytics.commonSources.filter(s => s.sourceType === 'Internet').length;
    const topPublicationSources = analytics.commonSources.filter(s => s.sourceType === 'Publication').length;
    const topStudentWorkSources = analytics.commonSources.filter(s => s.sourceType === 'Submitted Works').length;

    // Most problematic source (highest occurrence + uncited)
    const mostProblematicSource = analytics.commonSources
      .filter(s => !s.typicallyCited)
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)[0];

    // Citation quality breakdown
    const citationRate = analytics.citationPatterns.properCitationRate;
    const citationQuality = citationRate >= 80 ? 'good' : citationRate >= 60 ? 'fair' : 'poor';

    // Similarity risk breakdown
    const lowRiskCount = analytics.totalSubmissions - analytics.highRiskCount - mediumPriorityCount;

    return {
      totalSubmissions: analytics.totalSubmissions,
      avgSimilarity: analytics.averageSimilarity,
      medianSimilarity: analytics.medianSimilarity,
      highRiskCount: analytics.highRiskCount,
      mediumRiskCount: mediumPriorityCount,
      lowRiskCount: lowRiskCount > 0 ? lowRiskCount : 0,
      integrityIssuesCount: analytics.integrityIssuesCount,
      highPriorityInterventions,
      totalInterventionsNeeded: analytics.highRiskCount,
      topSourcesBreakdown: {
        internet: topInternetSources,
        publications: topPublicationSources,
        studentWork: topStudentWorkSources,
        total: analytics.commonSources.length,
      },
      mostProblematicSource: mostProblematicSource ? {
        name: mostProblematicSource.sourceName,
        affectedStudents: mostProblematicSource.occurrenceCount,
        avgSimilarity: mostProblematicSource.averageSimilarity,
      } : null,
      citationQuality: {
        rate: citationRate,
        rating: citationQuality,
        properlyCited: analytics.citationPatterns.properlyCited,
        uncited: analytics.citationPatterns.uncited,
        improperlyCited: analytics.citationPatterns.improperlyCited,
      },
      similarityRange: {
        min: analytics.minSimilarity,
        max: analytics.maxSimilarity,
        spread: analytics.maxSimilarity - analytics.minSimilarity,
      },
    };
  }, [analytics]);

  // Context data for chat (use course analytics if available, fallback to basic stats)
  const chatContext = analytics ? {
    screen: 'insights' as const,
    metrics: insightsMetrics,
    courseAnalytics: analytics,
    totalDocuments: analytics.totalSubmissions,
    avgSimilarity: analytics.averageSimilarity,
    highRiskCount: analytics.highRiskCount,
    commonSources: analytics.commonSources.slice(0, 5),
  } : {
    screen: 'insights' as const,
    stats,
    totalDocuments: stats.total,
    avgSimilarity: stats.avgSim,
  };

  // Dynamic, analytics-focused suggestions for instructors
  const promptSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (!insightsMetrics) {
      return [
        "What patterns should I look for in course analytics?",
        "How can I use this data to improve student learning?",
      ];
    }

    // High priority: Integrity issues
    if (insightsMetrics.highPriorityInterventions > 0) {
      suggestions.push(`Which ${insightsMetrics.highPriorityInterventions} student${insightsMetrics.highPriorityInterventions > 1 ? 's' : ''} with integrity concerns should I contact first?`);
    }

    // Citation quality concerns
    if (insightsMetrics.citationQuality.rating === 'poor') {
      suggestions.push(`How can I address the ${insightsMetrics.citationQuality.rate}% citation rate in my next class?`);
    } else if (insightsMetrics.citationQuality.rating === 'fair') {
      suggestions.push("What resources can help students improve their citation skills?");
    }

    // Problematic source patterns
    if (insightsMetrics.mostProblematicSource) {
      suggestions.push(`Why are ${insightsMetrics.mostProblematicSource.affectedStudents} students using "${insightsMetrics.mostProblematicSource.name}"?`);
    }

    // Overall course trends
    if (insightsMetrics.avgSimilarity > 30) {
      suggestions.push("Should I adjust my assignment to reduce similarity scores?");
    } else if (insightsMetrics.avgSimilarity < 15) {
      suggestions.push("Are students conducting enough research for this assignment?");
    }

    // Risk distribution analysis
    if (insightsMetrics.highRiskCount > insightsMetrics.totalSubmissions * 0.2) {
      suggestions.push(`What's causing ${insightsMetrics.highRiskCount} high-risk submissions in this assignment?`);
    }

    // Workload planning
    if (insightsMetrics.totalInterventionsNeeded > 5) {
      suggestions.push("Help me prioritize my academic integrity follow-ups");
    }

    // General insights if no specific concerns
    if (suggestions.length === 0) {
      suggestions.push("What does this data tell me about my students' research skills?");
      suggestions.push("How does this assignment compare to typical benchmarks?");
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }, [insightsMetrics]);

  // No global padding; chat integrates into layout below nav bars

  return (
    <div className="min-h-screen w-full relative">
      {/* Prototype Controls */}
      <PrototypeControls />

      {/* Main content area */}
      <div className="bg-gray-50">
        <InboxNavBar title="My Files" onSearchChange={() => {}} screen="insights" />
        <InboxTabs />

        {/* Two-column layout: left content with padding, right chat unconstrained by content padding */}
        <div className="flex items-stretch gap-0">
          <div className="flex-1 min-w-0 px-8 pb-8 pt-6">
            {/* Header with Export Buttons */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Course Analytics</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Insights across all submissions in your course
                </p>
              </div>
              <ExportButtons />
            </div>

            {(loading || analyticsLoading) && (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading course analytics...</div>
              </div>
            )}

            {error && <div className="text-red-600 mb-6">{error}</div>}

            {!loading && !analyticsLoading && !error && analytics && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <CourseStatsCards />

                {/* Distribution Chart */}
                <SimilarityDistributionChart />

                {/* Common Sources */}
                <CommonSourcesTable />

                {/* Student Interventions */}
                <InterventionsTable />
              </div>
            )}
          </div>

          {/* Right: Chat panel */}
          <GlobalChatPanel contextData={chatContext} promptSuggestions={promptSuggestions} />
        </div>
      </div>

      {/* Feature Flags Modal */}
      <FeatureFlagsModal />
    </div>
  );
}
