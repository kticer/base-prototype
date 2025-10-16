/**
 * Course analytics utilities for Story 2: Hero's Journey
 * Aggregates submission data to provide course-wide insights
 */

import type {
  CourseAnalytics,
  CourseSubmission,
  StudentPattern,
  CommonSource,
  CitationPatterns,
  SourceTypeTrends,
  InterventionRecommendation,
} from '../types/courseAnalytics';

/**
 * Compute comprehensive course analytics from submissions
 */
export function computeCourseAnalytics(
  submissions: CourseSubmission[]
): CourseAnalytics {
  if (submissions.length === 0) {
    return {
      totalSubmissions: 0,
      averageSimilarity: 0,
      medianSimilarity: 0,
      maxSimilarity: 0,
      minSimilarity: 0,
      highRiskCount: 0,
      integrityIssuesCount: 0,
      commonSources: [],
      citationPatterns: {
        properlyCited: 0,
        improperlyCited: 0,
        uncited: 0,
        total: 0,
        properCitationRate: 0,
      },
      sourceTypeTrends: {
        internetSources: 0,
        publicationSources: 0,
        studentWorkSources: 0,
        total: 0,
      },
      similarityDistribution: [],
    };
  }

  const similarities = submissions.map((s) => s.similarity);
  const sortedSimilarities = [...similarities].sort((a, b) => a - b);

  // Basic statistics
  const totalSubmissions = submissions.length;
  const averageSimilarity =
    similarities.reduce((sum, s) => sum + s, 0) / totalSubmissions;
  const medianSimilarity =
    sortedSimilarities[Math.floor(totalSubmissions / 2)];
  const maxSimilarity = Math.max(...similarities);
  const minSimilarity = Math.min(...similarities);
  const highRiskCount = similarities.filter((s) => s > 40).length;

  // Count integrity issues
  let integrityIssuesCount = 0;
  submissions.forEach((sub) => {
    if (sub.documentData?.matchCards) {
      const hasIssues = sub.documentData.matchCards.some(
        (mc: any) => mc.academicIntegrityIssue === true
      );
      if (hasIssues) integrityIssuesCount++;
    }
  });

  // Aggregate common sources
  const sourceMap = new Map<
    string,
    {
      sourceName: string;
      sourceType: string;
      submissions: string[];
      similarities: number[];
      citedCount: number;
      totalCount: number;
    }
  >();

  submissions.forEach((sub) => {
    if (!sub.documentData?.matchCards) return;

    sub.documentData.matchCards.forEach((mc: any) => {
      const key = mc.sourceName || 'Unknown Source';
      if (!sourceMap.has(key)) {
        sourceMap.set(key, {
          sourceName: key,
          sourceType: mc.sourceType || 'Internet',
          submissions: [],
          similarities: [],
          citedCount: 0,
          totalCount: 0,
        });
      }

      const entry = sourceMap.get(key)!;
      if (!entry.submissions.includes(sub.id)) {
        entry.submissions.push(sub.id);
      }
      entry.similarities.push(mc.similarityPercent || 0);
      entry.totalCount++;
      if (mc.isCited) entry.citedCount++;
    });
  });

  const commonSources: CommonSource[] = Array.from(sourceMap.values())
    .filter((source) => source.submissions.length > 1) // Only sources appearing in multiple submissions
    .map((source) => ({
      sourceName: source.sourceName,
      sourceType: source.sourceType as any,
      occurrenceCount: source.submissions.length,
      affectedSubmissions: source.submissions,
      averageSimilarity:
        source.similarities.reduce((sum, s) => sum + s, 0) /
        source.similarities.length,
      typicallyCited: source.citedCount / source.totalCount > 0.5,
    }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
    .slice(0, 10); // Top 10

  // Citation patterns
  let properlyCited = 0;
  let improperlyCited = 0;
  let uncited = 0;

  submissions.forEach((sub) => {
    if (!sub.documentData?.matchCards) return;

    sub.documentData.matchCards.forEach((mc: any) => {
      if (mc.citationStatus === 'properly_cited') {
        properlyCited++;
      } else if (mc.citationStatus === 'improperly_cited') {
        improperlyCited++;
      } else if (mc.citationStatus === 'not_cited') {
        uncited++;
      }
    });
  });

  const totalCitations = properlyCited + improperlyCited + uncited;
  const citationPatterns: CitationPatterns = {
    properlyCited,
    improperlyCited,
    uncited,
    total: totalCitations,
    properCitationRate: totalCitations > 0 ? (properlyCited / totalCitations) * 100 : 0,
  };

  // Source type trends
  let internetSources = 0;
  let publicationSources = 0;
  let studentWorkSources = 0;

  submissions.forEach((sub) => {
    if (!sub.documentData?.matchCards) return;

    sub.documentData.matchCards.forEach((mc: any) => {
      if (mc.sourceType === 'Internet') internetSources++;
      else if (mc.sourceType === 'Publication') publicationSources++;
      else if (mc.sourceType === 'Submitted Works') studentWorkSources++;
    });
  });

  const sourceTypeTrends: SourceTypeTrends = {
    internetSources,
    publicationSources,
    studentWorkSources,
    total: internetSources + publicationSources + studentWorkSources,
  };

  // Similarity distribution
  const ranges = [
    { min: 0, max: 10, label: '0-10%' },
    { min: 10, max: 20, label: '10-20%' },
    { min: 20, max: 30, label: '20-30%' },
    { min: 30, max: 40, label: '30-40%' },
    { min: 40, max: 50, label: '40-50%' },
    { min: 50, max: 100, label: '50%+' },
  ];

  const similarityDistribution = ranges.map((range) => {
    const count = similarities.filter(
      (s) => s >= range.min && s < range.max
    ).length;
    return {
      range: range.label,
      count,
      percentage: (count / totalSubmissions) * 100,
    };
  });

  return {
    totalSubmissions,
    averageSimilarity,
    medianSimilarity,
    maxSimilarity,
    minSimilarity,
    highRiskCount,
    integrityIssuesCount,
    commonSources,
    citationPatterns,
    sourceTypeTrends,
    similarityDistribution,
  };
}

/**
 * Analyze individual student patterns and flag those needing intervention
 */
export function analyzeStudentPatterns(
  submissions: CourseSubmission[]
): StudentPattern[] {
  return submissions.map((sub) => {
    const issues: string[] = [];
    let integrityIssuesCount = 0;
    let largestUncitedSource: number | null = null;
    let uncitedSources = 0;
    let totalSources = 0;

    if (sub.documentData?.matchCards) {
      sub.documentData.matchCards.forEach((mc: any) => {
        totalSources++;

        if (mc.academicIntegrityIssue) {
          integrityIssuesCount++;
          issues.push(mc.issueDescription || 'Academic integrity concern');
        }

        if (!mc.isCited && mc.similarityPercent > 5) {
          uncitedSources++;
          if (
            largestUncitedSource === null ||
            mc.similarityPercent > largestUncitedSource
          ) {
            largestUncitedSource = mc.similarityPercent;
          }
        }
      });
    }

    // Determine citation quality
    let citationQuality: 'good' | 'needs_improvement' | 'concerning';
    const citationRate = totalSources > 0 ? (totalSources - uncitedSources) / totalSources : 1;

    if (citationRate >= 0.8 && integrityIssuesCount === 0) {
      citationQuality = 'good';
    } else if (citationRate >= 0.5 || (integrityIssuesCount === 1 && largestUncitedSource && largestUncitedSource < 15)) {
      citationQuality = 'needs_improvement';
    } else {
      citationQuality = 'concerning';
    }

    // Determine if intervention is needed
    const needsIntervention =
      sub.similarity > 40 ||
      integrityIssuesCount > 1 ||
      (largestUncitedSource !== null && largestUncitedSource > 20) ||
      citationQuality === 'concerning';

    // Suggest intervention type
    let suggestedIntervention:
      | 'citation_training'
      | 'academic_integrity_meeting'
      | 'writing_support'
      | 'follow_up'
      | undefined;

    if (needsIntervention) {
      if (citationQuality === 'concerning' && integrityIssuesCount > 1) {
        suggestedIntervention = 'academic_integrity_meeting';
      } else if (uncitedSources > 2) {
        suggestedIntervention = 'citation_training';
      } else if (sub.similarity > 50) {
        suggestedIntervention = 'writing_support';
      } else {
        suggestedIntervention = 'follow_up';
      }
    }

    return {
      documentId: sub.id,
      studentName: sub.author,
      submissionTitle: sub.title,
      similarity: sub.similarity,
      integrityIssuesCount,
      largestUncitedSource,
      citationQuality,
      needsIntervention,
      suggestedIntervention,
      issues,
      dateAdded: sub.dateAdded,
    };
  });
}

/**
 * Generate prioritized intervention recommendations
 */
export function generateInterventionRecommendations(
  patterns: StudentPattern[]
): InterventionRecommendation[] {
  return patterns
    .filter((p) => p.needsIntervention)
    .map((student) => {
      // Determine priority
      let priority: 'high' | 'medium' | 'low';
      if (
        student.similarity > 50 ||
        student.integrityIssuesCount > 2 ||
        student.citationQuality === 'concerning'
      ) {
        priority = 'high';
      } else if (
        student.similarity > 40 ||
        student.integrityIssuesCount > 0
      ) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      // Generate action and rationale
      let action = '';
      let rationale = '';

      switch (student.suggestedIntervention) {
        case 'academic_integrity_meeting':
          action = 'Schedule one-on-one meeting to discuss academic integrity';
          rationale = `${student.studentName} has ${student.integrityIssuesCount} academic integrity issues, including ${student.issues.join(', ')}. A direct conversation is recommended.`;
          break;
        case 'citation_training':
          action = 'Provide citation training resources or workshop invitation';
          rationale = `${student.studentName} shows a pattern of uncited sources (${student.largestUncitedSource}% largest uncited match). Citation skills training would help.`;
          break;
        case 'writing_support':
          action = 'Refer to writing center for support with paraphrasing and synthesis';
          rationale = `${student.studentName}'s submission has ${student.similarity}% similarity, suggesting difficulty with paraphrasing and synthesizing sources effectively.`;
          break;
        case 'follow_up':
          action = 'Send follow-up email with feedback on citation practices';
          rationale = `${student.studentName} has minor citation issues that can be addressed with written feedback and encouragement.`;
          break;
        default:
          action = 'Review submission for potential issues';
          rationale = 'Submission flagged for review based on similarity patterns.';
      }

      return {
        student,
        priority,
        action,
        rationale,
      };
    })
    .sort((a, b) => {
      // Sort by priority: high > medium > low
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Export course analytics as CSV format
 */
export function exportAnalyticsAsCSV(analytics: CourseAnalytics): string {
  const lines: string[] = [];

  // Header
  lines.push('Course Analytics Summary');
  lines.push('');

  // Overall stats
  lines.push('Metric,Value');
  lines.push(`Total Submissions,${analytics.totalSubmissions}`);
  lines.push(`Average Similarity,${analytics.averageSimilarity.toFixed(1)}%`);
  lines.push(`Median Similarity,${analytics.medianSimilarity}%`);
  lines.push(`High Risk Count (>40%),${analytics.highRiskCount}`);
  lines.push(`Integrity Issues,${analytics.integrityIssuesCount}`);
  lines.push('');

  // Common sources
  lines.push('Common Sources Across Course');
  lines.push('Source Name,Source Type,Student Count,Avg Similarity');
  analytics.commonSources.forEach((source) => {
    lines.push(
      `"${source.sourceName}",${source.sourceType},${source.occurrenceCount},${source.averageSimilarity.toFixed(1)}%`
    );
  });
  lines.push('');

  // Citation patterns
  lines.push('Citation Patterns');
  lines.push('Status,Count');
  lines.push(`Properly Cited,${analytics.citationPatterns.properlyCited}`);
  lines.push(`Improperly Cited,${analytics.citationPatterns.improperlyCited}`);
  lines.push(`Not Cited,${analytics.citationPatterns.uncited}`);
  lines.push('');

  // Similarity distribution
  lines.push('Similarity Distribution');
  lines.push('Range,Count,Percentage');
  analytics.similarityDistribution.forEach((dist) => {
    lines.push(`${dist.range},${dist.count},${dist.percentage.toFixed(1)}%`);
  });

  return lines.join('\n');
}

/**
 * Export student interventions as CSV format
 */
export function exportInterventionsAsCSV(
  recommendations: InterventionRecommendation[]
): string {
  const lines: string[] = [];

  lines.push('Student Intervention Recommendations');
  lines.push('');
  lines.push(
    'Priority,Student Name,Submission,Similarity,Issues,Suggested Action,Rationale'
  );

  recommendations.forEach((rec) => {
    const student = rec.student;
    lines.push(
      `${rec.priority},"${student.studentName}","${student.submissionTitle}",${student.similarity}%,${student.integrityIssuesCount},"${rec.action}","${rec.rationale}"`
    );
  });

  return lines.join('\n');
}
