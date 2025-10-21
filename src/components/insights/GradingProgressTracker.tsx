import React from 'react';
import { useCourseAnalytics } from '../../hooks/useCourseAnalytics';
import { useStudentInterventions } from '../../hooks/useCourseAnalytics';

export function GradingProgressTracker() {
  const { analytics } = useCourseAnalytics(false);
  const { patterns } = useStudentInterventions();

  if (!analytics) return null;

  // Calculate grading statistics
  const graded = patterns.filter(p => p.integrityIssuesCount === 0).length; // Mock: assume no issues = graded
  const needsReview = patterns.filter(p => p.needsIntervention).length;
  const total = analytics.totalSubmissions;
  const ungraded = total - graded;

  const gradedPercent = (graded / total) * 100;
  const needsReviewPercent = (needsReview / total) * 100;
  const ungradedPercent = (ungraded / total) * 100;

  // Mock deadline - 3 days from now
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 3);
  const deadlineStr = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Calculate pace
  const daysUntilDeadline = 3;
  const neededPerDay = Math.ceil(ungraded / daysUntilDeadline);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Grading Progress</h3>
        <p className="text-sm text-gray-600 mt-1">
          Track completion status and deadline progress
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-gray-900">{graded} / {total} graded</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
          <div
            className="bg-green-500 h-full flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${gradedPercent}%` }}
          >
            {gradedPercent > 10 && `${gradedPercent.toFixed(0)}%`}
          </div>
          <div
            className="bg-yellow-500 h-full flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${needsReviewPercent}%` }}
          >
            {needsReviewPercent > 10 && `${needsReviewPercent.toFixed(0)}%`}
          </div>
          <div
            className="bg-gray-300 h-full flex items-center justify-center text-xs font-medium text-gray-700"
            style={{ width: `${ungradedPercent}%` }}
          >
            {ungradedPercent > 10 && `${ungradedPercent.toFixed(0)}%`}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Graded ({graded})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Needs Review ({needsReview})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>Ungraded ({ungraded})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deadline and pace */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-xs text-blue-700 font-medium mb-1">Grading Deadline</div>
          <div className="text-lg font-bold text-blue-900">{deadlineStr}</div>
          <div className="text-xs text-blue-600 mt-1">{daysUntilDeadline} days remaining</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-xs text-purple-700 font-medium mb-1">Required Pace</div>
          <div className="text-lg font-bold text-purple-900">{neededPerDay} per day</div>
          <div className="text-xs text-purple-600 mt-1">to meet deadline</div>
        </div>
      </div>

      {/* Status message */}
      {ungraded > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-800">
              <span className="font-medium">Action needed:</span> {ungraded} submissions still need grading.
              {needsReview > 0 && ` ${needsReview} require integrity review before grading.`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
