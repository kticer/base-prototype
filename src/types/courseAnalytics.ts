/**
 * Course-wide analytics types for Story 2: Hero's Journey
 * Aggregates data across all submissions to provide insights for educators
 */

import type { DocumentData } from './index';

/**
 * Common source appearing across multiple student submissions
 */
export interface CommonSource {
  /** Name of the source (e.g., "Wikipedia - Climate Change") */
  sourceName: string;
  /** Type of source */
  sourceType: 'Internet' | 'Publication' | 'Submitted Works';
  /** Number of students who matched this source */
  occurrenceCount: number;
  /** IDs of submissions that matched this source */
  affectedSubmissions: string[];
  /** Average similarity percentage for this source across submissions */
  averageSimilarity: number;
  /** Whether this source is typically cited or not */
  typicallyCited: boolean;
}

/**
 * Citation patterns across the course
 */
export interface CitationPatterns {
  /** Number of sources properly cited */
  properlyCited: number;
  /** Number of sources improperly cited (wrong format, incomplete) */
  improperlyCited: number;
  /** Number of sources not cited at all */
  uncited: number;
  /** Total number of sources analyzed */
  total: number;
  /** Percentage of properly cited sources */
  properCitationRate: number;
}

/**
 * Distribution of source types across submissions
 */
export interface SourceTypeTrends {
  /** Number of Internet sources */
  internetSources: number;
  /** Number of Publication sources (journals, books) */
  publicationSources: number;
  /** Number of Submitted Works sources (other students) */
  studentWorkSources: number;
  /** Total number of sources */
  total: number;
}

/**
 * Aggregated course-wide analytics
 */
export interface CourseAnalytics {
  /** Total number of submissions analyzed */
  totalSubmissions: number;
  /** Average similarity score across all submissions */
  averageSimilarity: number;
  /** Median similarity score */
  medianSimilarity: number;
  /** Highest similarity score in the course */
  maxSimilarity: number;
  /** Lowest similarity score in the course */
  minSimilarity: number;
  /** Number of submissions with high similarity (>40%) */
  highRiskCount: number;
  /** Number of submissions with academic integrity issues */
  integrityIssuesCount: number;
  /** Most common sources across the course */
  commonSources: CommonSource[];
  /** Citation quality patterns */
  citationPatterns: CitationPatterns;
  /** Source type distribution */
  sourceTypeTrends: SourceTypeTrends;
  /** Submissions grouped by similarity range */
  similarityDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Individual student pattern analysis
 */
export interface StudentPattern {
  /** Document/submission ID */
  documentId: string;
  /** Student name */
  studentName: string;
  /** Submission title */
  submissionTitle: string;
  /** Overall similarity percentage */
  similarity: number;
  /** Number of academic integrity issues found */
  integrityIssuesCount: number;
  /** Largest uncited source percentage */
  largestUncitedSource: number | null;
  /** Citation quality rating */
  citationQuality: 'good' | 'needs_improvement' | 'concerning';
  /** Whether this student needs intervention */
  needsIntervention: boolean;
  /** Suggested intervention type */
  suggestedIntervention?: 'citation_training' | 'academic_integrity_meeting' | 'writing_support' | 'follow_up';
  /** Specific issues detected */
  issues: string[];
  /** Date submitted */
  dateAdded: string;
}

/**
 * Intervention recommendation
 */
export interface InterventionRecommendation {
  /** Student pattern that triggered this recommendation */
  student: StudentPattern;
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  /** Recommended action */
  action: string;
  /** Detailed rationale */
  rationale: string;
}

/**
 * Input data for computing course analytics
 */
export interface CourseSubmission {
  id: string;
  title: string;
  author: string;
  similarity: number;
  dateAdded: string;
  /** Full document data with match cards */
  documentData?: DocumentData;
}
