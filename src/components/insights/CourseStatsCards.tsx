/**
 * Course statistics cards for InsightsPage
 * Displays key metrics from course analytics
 */

import React from 'react';
import { useCourseStats } from '../../hooks/useCourseAnalytics';

export const CourseStatsCards: React.FC = () => {
  const stats = useCourseStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Submissions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Total Submissions
        </div>
        <div className="mt-2 text-3xl font-bold text-gray-900">
          {stats.totalSubmissions}
        </div>
      </div>

      {/* Average Similarity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Average Similarity
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">
            {stats.averageSimilarity.toFixed(1)}
          </span>
          <span className="ml-2 text-xl text-gray-500">%</span>
        </div>
      </div>

      {/* High Risk Count */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          High Risk (&gt;40%)
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl font-bold text-red-600">
            {stats.highRiskCount}
          </span>
          {stats.totalSubmissions > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              ({((stats.highRiskCount / stats.totalSubmissions) * 100).toFixed(0)}%)
            </span>
          )}
        </div>
      </div>

      {/* Citation Rate */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Proper Citation Rate
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl font-bold text-green-600">
            {stats.properCitationRate.toFixed(0)}
          </span>
          <span className="ml-2 text-xl text-gray-500">%</span>
        </div>
      </div>
    </div>
  );
};
