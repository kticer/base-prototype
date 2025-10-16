import {
  computeCourseAnalytics,
  analyzeStudentPatterns,
  generateInterventionRecommendations,
} from '../utils/courseAnalytics';
import type { CourseSubmission } from '../types/courseAnalytics';

describe('Course Analytics', () => {
  const mockSubmissions: CourseSubmission[] = [
    {
      id: 'doc1',
      title: 'Test Paper 1',
      author: 'Alice Student',
      similarity: 25,
      dateAdded: '2025-10-01',
      documentData: {
        id: 'doc1',
        title: 'Test Paper 1',
        author: 'Alice Student',
        similarity: 25,
        pages: [],
        highlights: [],
        matchCards: [
          {
            id: 'mc1',
            sourceType: 'Internet',
            sourceName: 'Wikipedia - Climate Change',
            matchCount: 2,
            similarityPercent: 15,
            isCited: true,
            citationStatus: 'properly_cited',
            academicIntegrityIssue: false,
            matches: [],
          },
          {
            id: 'mc2',
            sourceType: 'Publication',
            sourceName: 'Nature Journal',
            matchCount: 1,
            similarityPercent: 10,
            isCited: true,
            citationStatus: 'properly_cited',
            academicIntegrityIssue: false,
            matches: [],
          },
        ],
      } as any,
    },
    {
      id: 'doc2',
      title: 'Test Paper 2',
      author: 'Bob Student',
      similarity: 45,
      dateAdded: '2025-10-02',
      documentData: {
        id: 'doc2',
        title: 'Test Paper 2',
        author: 'Bob Student',
        similarity: 45,
        pages: [],
        highlights: [],
        matchCards: [
          {
            id: 'mc3',
            sourceType: 'Internet',
            sourceName: 'Wikipedia - Climate Change',
            matchCount: 1,
            similarityPercent: 25,
            isCited: false,
            citationStatus: 'not_cited',
            academicIntegrityIssue: true,
            issueDescription: 'Large uncited block',
            matches: [],
          },
          {
            id: 'mc4',
            sourceType: 'Submitted Works',
            sourceName: 'Previous Student Paper',
            matchCount: 1,
            similarityPercent: 20,
            isCited: false,
            citationStatus: 'not_cited',
            academicIntegrityIssue: true,
            issueDescription: 'Match to student work',
            matches: [],
          },
        ],
      } as any,
    },
    {
      id: 'doc3',
      title: 'Test Paper 3',
      author: 'Carol Student',
      similarity: 12,
      dateAdded: '2025-10-03',
      documentData: {
        id: 'doc3',
        title: 'Test Paper 3',
        author: 'Carol Student',
        similarity: 12,
        pages: [],
        highlights: [],
        matchCards: [
          {
            id: 'mc5',
            sourceType: 'Publication',
            sourceName: 'Science Magazine',
            matchCount: 1,
            similarityPercent: 12,
            isCited: true,
            citationStatus: 'properly_cited',
            academicIntegrityIssue: false,
            matches: [],
          },
        ],
      } as any,
    },
  ];

  describe('computeCourseAnalytics', () => {
    it('should compute basic statistics correctly', () => {
      const analytics = computeCourseAnalytics(mockSubmissions);

      expect(analytics.totalSubmissions).toBe(3);
      expect(analytics.averageSimilarity).toBeCloseTo(27.33, 1);
      expect(analytics.medianSimilarity).toBe(25);
      expect(analytics.maxSimilarity).toBe(45);
      expect(analytics.minSimilarity).toBe(12);
      expect(analytics.highRiskCount).toBe(1); // doc2 is >40%
      expect(analytics.integrityIssuesCount).toBe(1); // doc2 has issues
    });

    it('should identify common sources', () => {
      const analytics = computeCourseAnalytics(mockSubmissions);

      expect(analytics.commonSources.length).toBe(1); // Wikipedia appears in 2 submissions
      expect(analytics.commonSources[0].sourceName).toBe(
        'Wikipedia - Climate Change'
      );
      expect(analytics.commonSources[0].occurrenceCount).toBe(2);
    });

    it('should compute citation patterns', () => {
      const analytics = computeCourseAnalytics(mockSubmissions);

      expect(analytics.citationPatterns.properlyCited).toBe(3);
      expect(analytics.citationPatterns.uncited).toBe(2);
      expect(analytics.citationPatterns.total).toBe(5);
      expect(analytics.citationPatterns.properCitationRate).toBe(60);
    });

    it('should compute source type trends', () => {
      const analytics = computeCourseAnalytics(mockSubmissions);

      expect(analytics.sourceTypeTrends.internetSources).toBe(2);
      expect(analytics.sourceTypeTrends.publicationSources).toBe(2);
      expect(analytics.sourceTypeTrends.studentWorkSources).toBe(1);
      expect(analytics.sourceTypeTrends.total).toBe(5);
    });

    it('should compute similarity distribution', () => {
      const analytics = computeCourseAnalytics(mockSubmissions);

      const dist = analytics.similarityDistribution;
      expect(dist.find((d) => d.range === '0-10%')?.count).toBe(0);
      expect(dist.find((d) => d.range === '10-20%')?.count).toBe(1);
      expect(dist.find((d) => d.range === '20-30%')?.count).toBe(1);
      expect(dist.find((d) => d.range === '40-50%')?.count).toBe(1);
    });

    it('should handle empty submissions', () => {
      const analytics = computeCourseAnalytics([]);

      expect(analytics.totalSubmissions).toBe(0);
      expect(analytics.commonSources).toEqual([]);
    });
  });

  describe('analyzeStudentPatterns', () => {
    it('should identify students needing intervention', () => {
      const patterns = analyzeStudentPatterns(mockSubmissions);

      expect(patterns.length).toBe(3);

      const bobPattern = patterns.find((p) => p.studentName === 'Bob Student');
      expect(bobPattern?.needsIntervention).toBe(true);
      expect(bobPattern?.citationQuality).toBe('concerning');
      expect(bobPattern?.integrityIssuesCount).toBe(2);
    });

    it('should identify good citation quality', () => {
      const patterns = analyzeStudentPatterns(mockSubmissions);

      const alicePattern = patterns.find(
        (p) => p.studentName === 'Alice Student'
      );
      expect(alicePattern?.citationQuality).toBe('good');
      expect(alicePattern?.needsIntervention).toBe(false);
    });

    it('should suggest appropriate interventions', () => {
      const patterns = analyzeStudentPatterns(mockSubmissions);

      const bobPattern = patterns.find((p) => p.studentName === 'Bob Student');
      expect(bobPattern?.suggestedIntervention).toBe(
        'academic_integrity_meeting'
      );
    });
  });

  describe('generateInterventionRecommendations', () => {
    it('should generate prioritized recommendations', () => {
      const patterns = analyzeStudentPatterns(mockSubmissions);
      const recommendations = generateInterventionRecommendations(patterns);

      expect(recommendations.length).toBe(1); // Only Bob needs intervention
      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].student.studentName).toBe('Bob Student');
    });

    it('should sort by priority', () => {
      const mixedPatterns = analyzeStudentPatterns(mockSubmissions);
      const recommendations = generateInterventionRecommendations(mixedPatterns);

      // All high priority recommendations should come first
      let seenNonHigh = false;
      recommendations.forEach((rec) => {
        if (rec.priority !== 'high') {
          seenNonHigh = true;
        } else if (seenNonHigh) {
          fail('High priority recommendations should come first');
        }
      });
    });
  });
});
