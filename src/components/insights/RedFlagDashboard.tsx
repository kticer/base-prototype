import React from 'react';
import { useStudentInterventions } from '../../hooks/useCourseAnalytics';
import { useCommonSources } from '../../hooks/useCourseAnalytics';

export function RedFlagDashboard() {
  const { patterns } = useStudentInterventions();
  const commonSources = useCommonSources();

  // Detect red flags
  const watchlist = patterns.filter(p =>
    p.integrityIssuesCount > 2 || p.similarity > 50
  ).slice(0, 5);

  // Suspicious patterns: same rare source used by multiple students
  const suspiciousSources = commonSources
    .filter(s => !s.typicallyCited && s.occurrenceCount >= 3 && s.averageSimilarity > 20)
    .slice(0, 3);

  // Mock turnaround time data
  const quickSubmissions = patterns
    .filter((_, idx) => idx % 5 === 0) // Mock: every 5th student was unusually fast
    .slice(0, 3)
    .map(p => ({ ...p, minutesToComplete: Math.floor(Math.random() * 30) + 5 }));

  const totalRedFlags = watchlist.length + suspiciousSources.length + quickSubmissions.length;

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg shadow-sm border border-red-200 p-6">
      <div className="mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Red Flag Dashboard</h3>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        {totalRedFlags > 0 ? `${totalRedFlags} potential academic integrity concern${totalRedFlags > 1 ? 's' : ''} detected` : 'No red flags detected'}
      </p>

      {totalRedFlags === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-700 font-medium">All Clear</p>
          <p className="text-sm text-gray-600 mt-1">No suspicious patterns detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Watchlist */}
          {watchlist.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-semibold text-gray-900">Academic Integrity Watchlist</h4>
              </div>
              <div className="space-y-2">
                {watchlist.map((student, idx) => (
                  <div key={idx} className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                        <div className="text-xs text-gray-600 mt-1">{student.submissionTitle}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-red-700 font-semibold">{student.similarity}% similarity</span>
                          {student.integrityIssuesCount > 0 && (
                            <span className="text-red-700">{student.integrityIssuesCount} integrity issues</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suspicious patterns */}
          {suspiciousSources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-semibold text-gray-900">Suspicious Source Patterns</h4>
              </div>
              <div className="space-y-2">
                {suspiciousSources.map((source, idx) => (
                  <div key={idx} className="bg-white border border-orange-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900">{source.sourceName}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Used by {source.occurrenceCount} students · {source.averageSimilarity.toFixed(1)}% avg similarity · Typically uncited
                    </div>
                    <div className="text-xs text-orange-700 mt-2">
                      ⚠ May indicate shared resource or collaboration
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick turnaround */}
          {quickSubmissions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-semibold text-gray-900">Unusually Quick Submissions</h4>
              </div>
              <div className="space-y-2">
                {quickSubmissions.map((student, idx) => (
                  <div key={idx} className="bg-white border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Completed in ~{student.minutesToComplete} minutes
                        </div>
                      </div>
                      <div className="text-xs text-amber-700 font-medium">
                        Unusually fast
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
