import React from 'react';
import { useCourseAnalytics, useHighPriorityInterventions } from '../../hooks/useCourseAnalytics';
import { useStore } from '../../store';

export function ActionableInsightsPanel() {
  const { analytics } = useCourseAnalytics(false);
  const highPriorityStudents = useHighPriorityInterventions();
  const { addChatMessage, setGeneratingArtifact } = useStore();

  if (!analytics) return null;

  // Handler for View Priority Queue action
  const handleViewPriorityQueue = () => {
    // Create a table artifact with high priority interventions
    const tableArtifact = {
      type: 'table',
      title: 'Priority Intervention Queue',
      headers: ['Priority', 'Student', 'Submission', 'Similarity', 'Issues', 'Action Needed'],
      rows: highPriorityStudents.map((rec, idx) => [
        `#${idx + 1}`,
        rec.student.studentName,
        rec.student.submissionTitle,
        `${rec.student.similarity}%`,
        rec.student.integrityIssuesCount > 0 ? `${rec.student.integrityIssuesCount} integrity issues` : 'High similarity',
        rec.action
      ])
    };

    // Add message to chat
    addChatMessage({
      role: 'assistant',
      content: `Here's your priority intervention queue with ${highPriorityStudents.length} students requiring attention:`,
      artifact: tableArtifact
    });

    // Set the artifact to display
    setGeneratingArtifact(true, tableArtifact);
  };

  // Generate AI-like recommendations based on data
  const insights: Array<{ type: 'action' | 'warning' | 'success' | 'info'; text: string; action?: string; onClick?: () => void }> = [];

  // High priority interventions
  if (highPriorityStudents.length > 0) {
    insights.push({
      type: 'action',
      text: `Schedule meetings with ${highPriorityStudents.length} student${highPriorityStudents.length > 1 ? 's' : ''} showing academic integrity concerns`,
      action: 'View Priority Queue',
      onClick: handleViewPriorityQueue
    });
  }

  // Citation quality
  if (analytics.citationPatterns.properCitationRate < 60) {
    insights.push({
      type: 'warning',
      text: `Only ${analytics.citationPatterns.properCitationRate.toFixed(0)}% of sources are properly cited. Consider a class-wide citation refresher.`
    });
  }

  // High similarity rate
  const highSimRate = (analytics.highRiskCount / analytics.totalSubmissions) * 100;
  if (highSimRate > 25) {
    insights.push({
      type: 'warning',
      text: `${highSimRate.toFixed(0)}% of submissions show high similarity. Review assignment prompt for clarity on original work expectations.`,
      action: 'Review Assignment'
    });
  }

  // Source diversity
  const avgSourcesPerStudent = analytics.commonSources.length / analytics.totalSubmissions;
  if (avgSourcesPerStudent < 3) {
    insights.push({
      type: 'info',
      text: 'Students are using a limited number of sources. Consider providing additional research resources.'
    });
  }

  // Common problematic source
  const problematicSource = analytics.commonSources
    .filter(s => !s.typicallyCited && s.occurrenceCount > 3)
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)[0];

  if (problematicSource) {
    insights.push({
      type: 'action',
      text: `${problematicSource.occurrenceCount} students used "${problematicSource.sourceName}" without citations. Address in class discussion.`,
      action: 'View Source Details'
    });
  }

  // Positive feedback
  if (analytics.citationPatterns.properCitationRate >= 80) {
    insights.push({
      type: 'success',
      text: `${analytics.citationPatterns.properCitationRate.toFixed(0)}% proper citation rate - students are demonstrating good academic integrity!`
    });
  }

  // Grading pace
  const avgSimilarity = analytics.averageSimilarity;
  if (avgSimilarity < 20) {
    insights.push({
      type: 'info',
      text: 'Low average similarity suggests students are producing original work. Focus grading on content quality.',
      action: 'Start Grading'
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights & Next Steps</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Recommended actions based on your course analytics
      </p>

      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const styles = {
            action: {
              bg: 'bg-blue-50',
              border: 'border-blue-200',
              icon: 'text-blue-600',
              text: 'text-blue-900',
              iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            },
            warning: {
              bg: 'bg-amber-50',
              border: 'border-amber-200',
              icon: 'text-amber-600',
              text: 'text-amber-900',
              iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            },
            success: {
              bg: 'bg-green-50',
              border: 'border-green-200',
              icon: 'text-green-600',
              text: 'text-green-900',
              iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            },
            info: {
              bg: 'bg-purple-50',
              border: 'border-purple-200',
              icon: 'text-purple-600',
              text: 'text-purple-900',
              iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            }
          };

          const style = styles[insight.type];

          return (
            <div key={idx} className={`${style.bg} border ${style.border} rounded-lg p-4`}>
              <div className="flex items-start gap-3">
                <svg className={`w-5 h-5 ${style.icon} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
                </svg>
                <div className="flex-1">
                  <p className={`text-sm ${style.text}`}>{insight.text}</p>
                  {insight.action && (
                    <button
                      onClick={insight.onClick}
                      className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                    >
                      {insight.action} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">All metrics look good!</p>
          <p className="text-sm mt-1">No immediate actions required.</p>
        </div>
      )}
    </div>
  );
}
